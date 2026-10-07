// Escrow payments (migration 0022). The company pays Folio, Folio holds it, verifying the work releases it to
// the student, and the student withdraws to PayPal. Money-moving functions in the database can only be called
// with the service role, so they all live here on the server, behind a signed-in user's checks.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { EMAIL } from "../form";
import { paymentsMode, splitPrice, type PaymentsMode } from "../payments/config";
import * as paypal from "../payments/paypal";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";
import type { StudentProfile } from "../types";
import { UUID } from "./shared";

const NEEDS_MIGRATION = "Payments need migration 0022. Run supabase/migrations/0022_payments.sql in the Supabase SQL Editor.";
const missing = (e: { code?: string } | null) => e?.code === "42P01" || e?.code === "PGRST205" || e?.code === "PGRST202" || e?.code === "42883" || e?.code === "42703";

export type EscrowStatus = "awaiting_payment" | "held" | "released" | "paid_out" | "refunded";
export type Escrow = { id: string; projectId: string; payerId: string; status: EscrowStatus; amountCents: number; feeCents: number; totalCents: number; provider: string; providerRef: string | null };

const toEscrow = (r: any): Escrow => ({
  id: r.id, projectId: r.project_id, payerId: r.payer_id, status: r.status, amountCents: r.amount_cents, feeCents: r.fee_cents,
  totalCents: r.amount_cents + r.fee_cents, provider: r.provider, providerRef: r.provider_ref,
});

// ---------------------------------------------------------------- company side: pay to publish

/** The escrow of a project, if it has one (visible to the paying company, and to the hired student). */
export async function getEscrow(projectId: string): Promise<Escrow | null> {
  if (!UUID.test(projectId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("escrows").select("*").eq("project_id", projectId).maybeSingle();
  return data ? toEscrow(data) : null;
}

/** Creates the escrow for a freshly posted draft project. Only the project's own client can do this. */
export async function createEscrow(user: StudentProfile, projectId: string, priceEur: number): Promise<{ error?: string }> {
  const mode = paymentsMode();
  if (mode === "off") return { error: "Payments aren't available yet." };
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, status, client_id").eq("id", projectId).eq("client_id", user.id).maybeSingle(); // row-level security: only visible to its owner
  if (!project || project.status !== "draft") return { error: "Project not found." };
  const { amountCents, feeCents } = splitPrice(priceEur);
  const { error } = await createAdminClient().from("escrows").insert({ project_id: projectId, payer_id: user.id, amount_cents: amountCents, fee_cents: feeCents, provider: mode });
  if (error) { console.error("createEscrow", error); return { error: missing(error) ? NEEDS_MIGRATION : "Couldn't set up the payment. Try again." }; }
  return {};
}

/** Starts paying for a project: simulated mode funds it straight away, PayPal mode returns the checkout URL. */
export async function startFunding(user: StudentProfile, projectId: string, origin: string): Promise<{ url?: string; funded?: boolean; error?: string }> {
  const mode = paymentsMode();
  if (mode === "off") return { error: "Payments aren't available yet." };
  const escrow = await getEscrow(projectId);
  if (!escrow || escrow.payerId !== user.id) return { error: "Project not found." };
  if (escrow.status !== "awaiting_payment") return { funded: true };
  const admin = createAdminClient();

  if (mode === "simulated") {
    await admin.from("escrows").update({ provider: "simulated" }).eq("id", escrow.id);
    const { data, error } = await admin.rpc("fund_escrow", { p_escrow: escrow.id, p_provider_ref: "simulated" });
    if (error) { console.error("fund_escrow", error); return { error: missing(error) ? NEEDS_MIGRATION : "Couldn't record the payment." }; }
    return data ? { funded: true } : { error: "This project was already paid." };
  }

  try {
    const order = await paypal.createOrder({
      escrowId: escrow.id, totalCents: escrow.totalCents, description: "Folio project payment",
      returnUrl: `${origin}/api/payments/paypal/return?escrow=${escrow.id}`, cancelUrl: `${origin}/company/projects/${projectId}/pay?cancelled=1`,
    });
    await admin.from("escrows").update({ provider: "paypal", provider_ref: order.orderId }).eq("id", escrow.id);
    return { url: order.approveUrl };
  } catch (e) {
    console.error("startFunding", e);
    return { error: e instanceof paypal.PayPalError ? e.message : "Couldn't reach PayPal. Try again." };
  }
}

/** The company came back from PayPal: take the money, check it is exactly right, then open the project. */
export async function completeFunding(user: StudentProfile, escrowId: string, orderId: string): Promise<{ projectId?: string; error?: string }> {
  if (!UUID.test(escrowId) || !orderId) return { error: "Payment not found." };
  const supabase = await createClient();
  const { data } = await supabase.from("escrows").select("*").eq("id", escrowId).maybeSingle();
  if (!data) return { error: "Payment not found." };
  const escrow = toEscrow(data);
  if (escrow.payerId !== user.id) return { error: "Payment not found." };
  if (escrow.status !== "awaiting_payment") return { projectId: escrow.projectId };       // already done (page reload)
  if (escrow.provider !== "paypal" || escrow.providerRef !== orderId) return { error: "That payment doesn't match this project." };
  try {
    const cap = await paypal.captureOrder(orderId);
    if (!cap.completed || !cap.captureId) return { error: "PayPal didn't complete the payment." };
    if (cap.cents !== escrow.totalCents || cap.currency !== "EUR" || cap.escrowId !== escrow.id) {
      console.error("completeFunding mismatch", { cap, escrow });
      return { error: "The amount PayPal took doesn't match the project. Contact support." };
    }
    const { error } = await createAdminClient().rpc("fund_escrow", { p_escrow: escrow.id, p_provider_ref: cap.captureId });
    if (error) { console.error("fund_escrow", error); return { error: "Paid, but we couldn't open the project. Contact support." }; }
    return { projectId: escrow.projectId };
  } catch (e) {
    console.error("completeFunding", e);
    return { error: e instanceof paypal.PayPalError ? e.message : "Couldn't confirm the payment with PayPal." };
  }
}

// ---------------------------------------------------------------- student side: balance and withdrawals

export type LedgerKind = "escrow" | "review" | "available" | "processing" | "paid";
export type LedgerRow = { escrowId: string; projectId: string; title: string; org: string; amountCents: number; kind: LedgerKind; at: string };
export type Ledger = {
  rows: LedgerRow[];
  availableCents: number;   // released, ready to withdraw
  heldCents: number;        // paid by the company, held until the work is verified (includes work under review)
  reviewCents: number;      // the part of that already submitted, waiting for the client
  processingCents: number;  // a withdrawal in flight
  paidCents: number;        // withdrawn
  paypalEmail: string | null;
  mode: PaymentsMode;
};

export async function getLedger(user: StudentProfile): Promise<Ledger> {
  const empty: Ledger = { rows: [], availableCents: 0, heldCents: 0, reviewCents: 0, processingCents: 0, paidCents: 0, paypalEmail: null, mode: paymentsMode() };
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("paypal_email").eq("id", user.id).maybeSingle();
  const paypalEmail = (profile as any)?.paypal_email ?? null;
  const { data: escrows, error } = await supabase.from("escrows").select("*").in("status", ["held", "released", "paid_out"]);
  if (error || !escrows?.length) return { ...empty, paypalEmail };

  const ids = escrows.map((e: any) => e.project_id);
  const [{ data: projects }, { data: apps }] = await Promise.all([
    supabase.from("project_cards").select("id, title, org_name, client_name").in("id", ids),
    supabase.from("applications").select("project_id, status").eq("student_id", user.id).in("project_id", ids),
  ]);
  const rows: LedgerRow[] = escrows.flatMap((e: any) => {
    const p = (projects ?? []).find((x: any) => x.id === e.project_id);
    const app = (apps ?? []).find((a: any) => a.project_id === e.project_id);
    if (!p || (!app && e.student_id !== user.id)) return [];
    const kind: LedgerKind = e.status === "paid_out" ? "paid" : e.status === "released" ? (e.withdrawal_id ? "processing" : "available") : app?.status === "delivered" ? "review" : "escrow";
    return [{ escrowId: e.id, projectId: e.project_id, title: p.title, org: p.org_name ?? p.client_name, amountCents: e.amount_cents, kind, at: e.paid_out_at ?? e.released_at ?? e.funded_at ?? e.created_at }];
  }).sort((a, b) => b.at.localeCompare(a.at));
  const sum = (k: LedgerKind) => rows.filter((r) => r.kind === k).reduce((n, r) => n + r.amountCents, 0);
  return {
    rows, paypalEmail, mode: paymentsMode(),
    availableCents: sum("available"), processingCents: sum("processing"), paidCents: sum("paid"),
    reviewCents: sum("review"), heldCents: sum("escrow") + sum("review"),
  };
}

export async function savePaypalEmail(user: StudentProfile, email: string): Promise<{ error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL.test(clean)) return { error: "Enter the email of your PayPal account." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ paypal_email: clean }).eq("id", user.id);
  if (error) return { error: missing(error) || error.code === "42501" ? NEEDS_MIGRATION : "Couldn't save your PayPal email." };
  return {};
}

/** Pays out the student's whole available balance to their PayPal email. */
export async function withdraw(user: StudentProfile): Promise<{ cents?: number; error?: string }> {
  const mode = paymentsMode();
  if (mode === "off") return { error: "Withdrawals aren't available yet." };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_withdrawal", { p_student: user.id, p_provider: mode });
  if (error) {
    if (error.code === "P0001") return { error: error.message };
    console.error("create_withdrawal", error);
    return { error: missing(error) ? NEEDS_MIGRATION : "Couldn't start the withdrawal." };
  }
  const w = (data as any[])?.[0];
  if (!w) return { error: "Nothing to withdraw yet." };

  try {
    const ref = mode === "simulated" ? "simulated" : (await paypal.createPayout({ withdrawalId: w.out_id, email: w.out_email, cents: w.out_cents })).batchId ?? "paypal";
    await admin.rpc("complete_withdrawal", { p_id: w.out_id, p_ref: ref });
    return { cents: w.out_cents };
  } catch (e) {
    console.error("withdraw payout", e);
    await admin.rpc("fail_withdrawal", { p_id: w.out_id, p_error: e instanceof Error ? e.message : "Payout failed" }); // the money goes back to "available"
    return { error: e instanceof paypal.PayPalError ? e.message : "PayPal couldn't send the payout. Your balance is untouched, try again." };
  }
}

// ---------------------------------------------------------------- removing a project

/**
 * Deletes a project its poster no longer wants. If the company already paid and nobody was accepted, the payment
 * is refunded and the project is cancelled instead (the record of the money is kept).
 */
export async function removeProject(user: StudentProfile, projectId: string): Promise<{ kind?: "deleted" | "cancelled"; error?: string }> {
  if (!UUID.test(projectId)) return { error: "Project not found." };
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, status").eq("id", projectId).eq("client_id", user.id).maybeSingle();
  if (!project) return { error: "Project not found." };
  const escrow = await getEscrow(projectId);

  if (escrow && escrow.status === "held") {
    if (project.status !== "open") return { error: "Someone is already working on this, so it can't be cancelled." };
    try {
      const ref = escrow.provider === "paypal" && escrow.providerRef ? (await paypal.refundCapture({ captureId: escrow.providerRef, cents: escrow.totalCents })).refundId : "simulated";
      const { error } = await createAdminClient().rpc("cancel_funded_project", { p_project: projectId, p_owner: user.id, p_refund_ref: ref });
      if (error) {
        console.error("cancel_funded_project", error);
        return { error: error.code === "P0001" ? error.message : missing(error) ? "Cancelling needs migration 0023. Run it in the Supabase SQL Editor." : "The refund went through but the project couldn't be closed. Contact support." };
      }
      return { kind: "cancelled" };
    } catch (e) {
      console.error("removeProject refund", e);
      return { error: e instanceof paypal.PayPalError ? e.message : "Couldn't refund your payment. Nothing was changed." };
    }
  }

  const { error } = await supabase.rpc("delete_project", { p_id: projectId });
  if (error) {
    if (error.code === "P0001") return { error: error.message };
    console.error("delete_project", error);
    return { error: missing(error) ? "Deleting needs migration 0023. Run it in the Supabase SQL Editor." : "Couldn't delete the project. Try again." };
  }
  return { kind: "deleted" };
}

// ---------------------------------------------------------------- company side: what you paid

export type SpendKind = "awaiting" | "held" | "released" | "paid" | "refunded";
export type SpendRow = {
  escrowId: string; projectId: string; title: string; student: string | null; kind: SpendKind;
  amountCents: number; feeCents: number; totalCents: number; provider: string; at: string; fundedAt: string | null;
};
export type CompanyLedger = {
  rows: SpendRow[];
  awaitingCents: number;  // drafts not paid yet (price + fee)
  heldCents: number;      // held for students until you verify their work (price only)
  toStudentsCents: number; // released or paid out to students (price only)
  spentCents: number;     // everything you paid (price + fee), refunds excluded
  feesCents: number;      // Folio's fees inside that
  refundedCents: number;
  months: { label: string; value: number }[]; // spent per month, last 6, in euros
  mode: PaymentsMode;
};

export async function getCompanyLedger(user: StudentProfile): Promise<CompanyLedger> {
  const mode = paymentsMode();
  const empty: CompanyLedger = { rows: [], awaitingCents: 0, heldCents: 0, toStudentsCents: 0, spentCents: 0, feesCents: 0, refundedCents: 0, months: lastMonths([]), mode };
  const supabase = await createClient();
  const { data: escrows, error } = await supabase.from("escrows").select("*").eq("payer_id", user.id).order("created_at", { ascending: false });
  if (error || !escrows?.length) return empty;

  const ids = escrows.map((e: any) => e.project_id);
  const [{ data: projects }, { data: apps }] = await Promise.all([
    supabase.from("project_cards").select("id, title").in("id", ids),
    supabase.from("applications").select("project_id, student_id, status").in("project_id", ids).in("status", ["accepted", "delivered"]),
  ]);
  const studentIds = [...new Set([...(apps ?? []).map((a: any) => a.student_id), ...escrows.map((e: any) => e.student_id).filter(Boolean)])];
  const { data: people } = studentIds.length ? await supabase.from("profiles").select("id, full_name").in("id", studentIds) : { data: [] as any[] };
  const nameOf = (id?: string | null) => (id ? (people ?? []).find((p: any) => p.id === id)?.full_name ?? null : null);

  const KIND: Record<string, SpendKind> = { awaiting_payment: "awaiting", held: "held", released: "released", paid_out: "paid", refunded: "refunded" };
  const rows: SpendRow[] = escrows.map((e: any) => ({
    escrowId: e.id, projectId: e.project_id, title: (projects ?? []).find((p: any) => p.id === e.project_id)?.title ?? "Project",
    student: nameOf(e.student_id ?? (apps ?? []).find((a: any) => a.project_id === e.project_id)?.student_id),
    kind: KIND[e.status] ?? "awaiting", amountCents: e.amount_cents, feeCents: e.fee_cents, totalCents: e.amount_cents + e.fee_cents,
    provider: e.provider, fundedAt: e.funded_at,
    at: e.refunded_at ?? e.paid_out_at ?? e.released_at ?? e.funded_at ?? e.created_at,
  }));
  const sum = (kinds: SpendKind[], f: (r: SpendRow) => number) => rows.filter((r) => kinds.includes(r.kind)).reduce((n, r) => n + f(r), 0);
  const funded = rows.filter((r) => r.fundedAt && r.kind !== "refunded");
  return {
    rows, mode,
    awaitingCents: sum(["awaiting"], (r) => r.totalCents),
    heldCents: sum(["held"], (r) => r.amountCents),
    toStudentsCents: sum(["released", "paid"], (r) => r.amountCents),
    spentCents: funded.reduce((n, r) => n + r.totalCents, 0),
    feesCents: funded.reduce((n, r) => n + r.feeCents, 0),
    refundedCents: sum(["refunded"], (r) => r.totalCents),
    months: lastMonths(funded.map((r) => ({ at: r.fundedAt!, cents: r.totalCents }))),
  };
}

function lastMonths(items: { at: string; cents: number }[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const value = items.filter((x) => { const t = new Date(x.at); return t.getFullYear() === d.getFullYear() && t.getMonth() === d.getMonth(); }).reduce((n, x) => n + x.cents / 100, 0);
    return { label: d.toLocaleDateString("en-GB", { month: "short" }), value };
  });
}
