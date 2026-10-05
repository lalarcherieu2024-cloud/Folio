import { Landmark } from "lucide-react";
import { PaypalEmailForm } from "@/components/student/PaypalEmailForm";
import { WithdrawButton } from "@/components/student/WithdrawButton";
import { requireUser } from "@/lib/auth";
import { getLedger, type LedgerKind } from "@/lib/data/payments";
import { getPayments } from "@/lib/data/student";
import { eurFromCents } from "@/lib/payments/config";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/work";

export const metadata = { title: "Payments · Folio" };

type Kind = LedgerKind;
const STATUS: Record<Kind, [string, string]> = {
  paid: ["Paid", "bg-[#dcfce7] text-[#166534]"],
  available: ["Ready to withdraw", "bg-[#fef3c7] text-[#92400e]"],
  processing: ["Being sent to PayPal", "bg-[#e0f2fe] text-[#0c4a6e]"],
  escrow: ["Held in escrow", "bg-[#e0f2fe] text-[#0c4a6e]"],
  review: ["Releases on verification", "bg-[#ede9fe] text-[#5b21b6]"],
};
const card = "rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

export default async function PaymentsPage() {
  const user = await requireUser("/payments", "student");
  const [pay, ledger] = await Promise.all([getPayments(user), getLedger(user)]);
  const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  // Real escrow payments (migration 0022) take over from the older "derived from project status" rows.
  const real = new Set(ledger.rows.map((r) => r.projectId));
  const rows: { key: string; title: string; org: string; cents: number; kind: Kind; date: string }[] = [
    ...ledger.rows.map((r) => ({ key: r.escrowId, title: r.title, org: r.org, cents: r.amountCents, kind: r.kind, date: r.kind === "escrow" ? "Waiting for your work" : r.kind === "review" ? "After client sign-off" : date(r.at) })),
    ...pay.rows.filter((r) => !real.has(r.projectId)).map((r) => ({ key: r.projectId, title: r.title, org: r.org, cents: r.amount * 100, kind: r.kind as Kind, date: r.date })),
  ];
  const sumLegacy = (k: string) => pay.rows.filter((r) => r.kind === k && !real.has(r.projectId)).reduce((n, r) => n + r.amount * 100, 0);
  const earnedCents = ledger.paidCents + sumLegacy("paid");
  const heldCents = ledger.heldCents - ledger.reviewCents + sumLegacy("escrow");
  const reviewCents = ledger.reviewCents + sumLegacy("review");
  const onTheWay = heldCents + reviewCents + ledger.processingCents;
  const paidCount = rows.filter((r) => r.kind === "paid").length;

  // Earnings per month: the older paid projects plus real payouts, on the same six-month scale.
  const months = pay.months.map((m) => ({
    label: m.label,
    value: m.value + ledger.rows.filter((r) => r.kind === "paid" && new Date(r.at).toLocaleDateString("en-GB", { month: "short" }) === m.label).reduce((n, r) => n + r.amountCents / 100, 0),
  }));
  const max = Math.max(...months.map((m) => m.value), 1);
  const noEmail = !ledger.paypalEmail;

  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Payments</h1>
        <p className="max-w-[64ch] text-[0.9375rem] text-muted-foreground">What you&apos;ve earned, and what&apos;s on the way. The company pays Folio before the project opens; Folio holds it and releases it to you when they verify your work.</p>
      </div>

      {ledger.mode === "simulated" && <p className="rounded-lg border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-[0.8125rem] text-[#92400e]"><b className="font-semibold">Test mode.</b> No real money moves: payments and withdrawals only update the records.</p>}
      {ledger.mode === "off" && <p className="rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600">Withdrawals aren&apos;t available on this site yet.</p>}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
        <div className={cn(card, "flex flex-col gap-2 p-5 shadow-[inset_0_3px_0_#f59e0b]")}>
          <span className="text-[0.8125rem] text-muted-foreground">Available to withdraw</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#92400e]">{eurFromCents(ledger.availableCents)}</span>
          <WithdrawButton label="Withdraw to PayPal" amountLabel={eurFromCents(ledger.availableCents)}
            disabledReason={ledger.mode === "off" ? "Withdrawals aren't available yet." : ledger.availableCents <= 0 ? "Nothing to withdraw yet." : noEmail ? "Add your PayPal email first." : undefined} />
        </div>
        <div className={cn(card, "flex flex-col gap-1.5 p-5 shadow-[inset_0_3px_0_#0369a1]")}>
          <span className="text-[0.8125rem] text-muted-foreground">On the way</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#0c4a6e]">{eurFromCents(onTheWay)}</span>
          <span className="text-xs text-muted-foreground">{eurFromCents(heldCents)} in escrow · {eurFromCents(reviewCents)} awaiting sign-off{ledger.processingCents > 0 ? ` · ${eurFromCents(ledger.processingCents)} being sent` : ""}</span>
        </div>
        <div className={cn(card, "flex flex-col gap-1.5 p-5 shadow-[inset_0_3px_0_#22c55e]")}>
          <span className="text-[0.8125rem] text-muted-foreground">Total earned</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#166534]">{eurFromCents(earnedCents)}</span>
          <span className="text-xs text-muted-foreground">{paidCount} payout{paidCount === 1 ? "" : "s"}</span>
        </div>
        <div className={cn(card, "flex flex-col gap-2.5 p-5")}>
          <span className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground"><Landmark className="size-3.5" />Payout account · PayPal</span>
          <PaypalEmailForm email={ledger.paypalEmail} />
        </div>
      </div>

      <div className={cn(card, "flex flex-col gap-4 p-5")}>
        <div className="flex flex-col gap-1"><span className="text-base font-semibold">Earnings by month</span><span className="text-[0.8125rem] text-muted-foreground">Paid out, last 6 months</span></div>
        <div className="grid h-[8.75rem] grid-cols-6 items-end gap-3">
          {months.map((m) => (
            <div key={m.label} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[0.6875rem] text-zinc-600">{m.value ? eur(m.value) : "–"}</span>
              <div className={cn("w-full max-w-12 rounded-t", m.value ? "bg-[#22c55e]" : "bg-zinc-200")} style={{ height: `${Math.max(4, Math.round((m.value / max) * 96))}px` }} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(card, "overflow-hidden")}>
        <div className="flex flex-col gap-1 px-5 pb-3 pt-5"><span className="text-base font-semibold">History</span><span className="text-[0.8125rem] text-muted-foreground">Every project payment, newest first</span></div>
        {rows.length === 0 ? (
          <div className="border-t border-zinc-100 px-5 py-8 text-sm text-muted-foreground">Nothing here yet. Once a client accepts you, the project shows up as &ldquo;Held in escrow&rdquo;.</div>
        ) : rows.map((r) => {
          const [label, tone] = STATUS[r.kind];
          return (
            <div key={r.key} className="flex flex-wrap items-center gap-4 border-t border-zinc-100 px-5 py-3.5">
              <div className="flex min-w-[12.5rem] flex-1 flex-col gap-0.5"><span className="text-sm font-medium">{r.title}</span><span className="text-[0.8125rem] text-muted-foreground">{r.org} · {r.date}</span></div>
              <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", tone)}>{label}</span>
              <span className={cn("w-20 text-right font-mono text-sm font-semibold", r.kind === "paid" && "text-[#166534]")}>{eurFromCents(r.cents)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
