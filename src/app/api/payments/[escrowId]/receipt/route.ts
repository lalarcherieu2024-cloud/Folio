import { getSession } from "@/lib/auth";
import { UUID } from "@/lib/data/shared";
import { getOrganization } from "@/lib/data/startup";
import { buildReceipt } from "@/lib/receipt";
import { createClient } from "@/lib/supabase/server";

const STATUS: Record<string, string> = { held: "Held in escrow", released: "Released to the student", paid_out: "Paid to the student", refunded: "Refunded" };

// A PDF receipt for a project the company paid for. Only the company that paid can download it.
export async function GET(_: Request, { params }: { params: Promise<{ escrowId: string }> }) {
  const { escrowId } = await params;
  if (!UUID.test(escrowId)) return new Response("Not found", { status: 404 });
  const user = await getSession();
  if (!user || user.role !== "company") return new Response("Sign in first", { status: 401 });
  const supabase = await createClient();
  const { data: e } = await supabase.from("escrows").select("*").eq("id", escrowId).eq("payer_id", user.id).maybeSingle();
  if (!e || !e.funded_at) return new Response("Not found", { status: 404 }); // no receipt before it is paid
  const [{ data: project }, org] = await Promise.all([supabase.from("project_cards").select("title").eq("id", e.project_id).maybeSingle(), getOrganization(user)]);
  const { data: student } = e.student_id ? await supabase.from("profiles").select("full_name").eq("id", e.student_id).maybeSingle() : { data: null };

  const pdf = await buildReceipt({
    receiptNo: String(e.id).slice(0, 8).toUpperCase(), paidAt: e.funded_at, company: org?.name ?? user.fullName, cif: org?.cif ?? "",
    payerName: user.fullName, payerEmail: user.email, projectTitle: project?.title ?? "Project", student: student?.full_name ?? null,
    amountCents: e.amount_cents, feeCents: e.fee_cents, status: STATUS[e.status] ?? e.status,
    method: e.provider === "paypal" ? "PayPal" : "Test mode (no real money moved)", reference: e.provider === "paypal" ? e.provider_ref : null,
  });
  return new Response(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Folio-receipt-${String(e.id).slice(0, 8)}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
