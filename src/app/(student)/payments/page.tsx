import { CircleCheck, FlaskConical, Hourglass, Send, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { PayPalMark } from "@/components/shared/PayPalMark";
import { PaypalEmailForm } from "@/components/student/PaypalEmailForm";
import { WithdrawButton } from "@/components/student/WithdrawButton";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getLedger, type LedgerKind } from "@/lib/data/payments";
import { getPayments } from "@/lib/data/student";
import { eurFromCents } from "@/lib/payments/config";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/work";

export const metadata = { title: "Payments · Folio" };

type Kind = LedgerKind;
// Each state money can be in, in the order it moves: its label, colour and icon (history rows and the flow).
const STATUS: Record<Kind, { label: string; fg: string; bg: string; icon: LucideIcon }> = {
  escrow: { label: "Held in escrow", fg: "#0369a1", bg: "#e0f2fe", icon: ShieldCheck },
  review: { label: "Awaiting sign-off", fg: "#6d28d9", bg: "#ede9fe", icon: Hourglass },
  available: { label: "Ready to withdraw", fg: "#b45309", bg: "#fef3c7", icon: Wallet },
  processing: { label: "Being sent to PayPal", fg: "#0e7490", bg: "#cffafe", icon: Send },
  paid: { label: "Paid", fg: "#15803d", bg: "#dcfce7", icon: CircleCheck },
};
const card = "rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]";
// Amounts in the page font with tabular figures (no monospace slashed zero).
const money = "font-semibold tabular-nums tracking-tight";

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
  const paidCount = rows.filter((r) => r.kind === "paid").length;

  // Earnings per month: the older paid projects plus real payouts, on the same six-month scale.
  const months = pay.months.map((m) => ({
    label: m.label,
    value: m.value + ledger.rows.filter((r) => r.kind === "paid" && new Date(r.at).toLocaleDateString("en-GB", { month: "short" }) === m.label).reduce((n, r) => n + r.amountCents / 100, 0),
  }));
  const max = Math.max(...months.map((m) => m.value), 1);
  const noEmail = !ledger.paypalEmail;

  // Where the money is right now, in the order it moves: held → signed off → withdrawable → sent → paid.
  const flow: { kind: Kind; cents: number; note: string }[] = [
    { kind: "escrow", cents: heldCents, note: "Paid by the company, kept safe while you work" },
    { kind: "review", cents: reviewCents, note: "Work submitted, waiting for the company to verify it" },
    { kind: "available", cents: ledger.availableCents, note: "Released to you: withdraw it any time" },
    { kind: "paid", cents: earnedCents, note: `${paidCount} payout${paidCount === 1 ? "" : "s"} so far` },
  ];
  const withdrawBlocked = ledger.mode === "off" ? "Withdrawals aren't available yet." : ledger.availableCents <= 0 ? "Nothing to withdraw yet. Money arrives here once a company verifies your work." : noEmail ? "Add your PayPal email first." : undefined;

  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Payments</h1>
        <p className="max-w-[64ch] text-[0.9375rem] text-muted-foreground">The company pays before the project starts. Folio holds the money and releases it to you when they verify your work.</p>
      </div>

      {ledger.mode === "simulated" && <p className="flex items-center gap-2 rounded-lg bg-[#fffbeb] px-4 py-2.5 text-[0.8125rem] text-[#92400e]"><FlaskConical className="size-4 shrink-0" /><span><b className="font-semibold">Test mode.</b> No real money moves: payments and withdrawals only update the records.</span></p>}
      {ledger.mode === "off" && <p className="rounded-lg bg-panel px-4 py-2.5 text-[0.8125rem] text-zinc-600">Withdrawals aren&apos;t available on this site yet.</p>}

      {/* Balance and where it goes, side by side. */}
      <div className={cn(card, "grid md:grid-cols-[1.2fr_1fr]")}>
        <div className="flex flex-col gap-4 p-6">
          <span className="text-sm text-muted-foreground">Available to withdraw</span>
          <span className={cn(money, "text-[2.5rem] leading-none")}>{eurFromCents(ledger.availableCents)}</span>
          <WithdrawButton label="Withdraw to PayPal" amountLabel={eurFromCents(ledger.availableCents)} disabledReason={withdrawBlocked} />
        </div>
        <div id="payout" className="flex scroll-mt-24 flex-col gap-3 border-t bg-panel/60 p-6 md:border-l md:border-t-0">
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <span className="grid size-6 place-items-center rounded-md bg-[#003087]"><PayPalMark className="size-3.5" /></span>Payout account
          </span>
          <PaypalEmailForm email={ledger.paypalEmail} />
        </div>
      </div>

      {/* The money's journey: one tile per state, in order. */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Where your money is</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
          {flow.map((f, i) => {
            const st = STATUS[f.kind];
            const Icon = st.icon;
            return (
              <li key={f.kind} className={cn(card, "relative flex flex-col gap-2 p-4", f.cents > 0 && "border-transparent")} style={f.cents > 0 ? { boxShadow: `0 0 0 1.5px ${st.fg}33`, background: `${st.bg}66` } : undefined}>
                <span className="flex items-center gap-2 text-[0.8125rem] font-medium" style={{ color: st.fg }}>
                  <span className="grid size-6 place-items-center rounded-full" style={{ background: st.bg }}><Icon className="size-3.5" /></span>
                  <span className="text-muted-foreground tabular-nums">{i + 1}.</span>{st.label}
                </span>
                <span className={cn(money, "text-2xl", f.cents === 0 && "text-zinc-400")}>{eurFromCents(f.cents)}</span>
                <span className="text-xs leading-snug text-muted-foreground">{f.note}</span>
              </li>
            );
          })}
        </ol>
        {ledger.processingCents > 0 && <p className="text-[0.8125rem] text-muted-foreground">{eurFromCents(ledger.processingCents)} is being sent to your PayPal right now.</p>}
      </div>

      {/* Monthly earnings, once there are any. */}
      {earnedCents > 0 && (
        <div className={cn(card, "flex flex-col gap-4 p-5")}>
          <div className="flex flex-col gap-1"><span className="text-base font-semibold">Earnings by month</span><span className="text-[0.8125rem] text-muted-foreground">Paid out, last 6 months</span></div>
          <div className="grid h-[8.75rem] grid-cols-6 items-end gap-3">
            {months.map((m) => (
              <div key={m.label} className="flex h-full flex-col items-center justify-end gap-1.5">
                <span className="text-[0.6875rem] tabular-nums text-zinc-600">{m.value ? eur(m.value) : ""}</span>
                <div className={cn("w-full max-w-12 rounded-t-md", m.value ? "bg-[#22c55e]" : "bg-zinc-100")} style={{ height: `${Math.max(4, Math.round((m.value / max) * 96))}px` }} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn(card, "overflow-hidden")}>
        <div className="flex flex-col gap-1 px-5 pb-3 pt-5"><span className="text-base font-semibold">History</span><span className="text-[0.8125rem] text-muted-foreground">Every project payment, newest first</span></div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t border-zinc-100 px-5 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-soft text-brand"><Wallet className="size-5" /></span>
            <span className="text-sm font-medium">No payments yet</span>
            <span className="max-w-[44ch] text-[0.8125rem] text-muted-foreground">When a company accepts you, their payment shows up here as held in escrow, so you know it&apos;s there before you start.</span>
            <Link href="/projects" className={cn(buttonVariants({ variant: "outline" }), "mt-1 h-8 bg-white px-3 text-[0.8125rem]")}>Find a project</Link>
          </div>
        ) : rows.map((r) => {
          const st = STATUS[r.kind];
          const Icon = st.icon;
          return (
            <div key={r.key} className="flex flex-wrap items-center gap-3.5 border-t border-zinc-100 px-5 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: st.bg, color: st.fg }}><Icon className="size-4" /></span>
              <div className="flex min-w-[12.5rem] flex-1 flex-col gap-0.5"><span className="text-sm font-medium">{r.title}</span><span className="text-[0.8125rem] text-muted-foreground">{r.org} · {r.date}</span></div>
              <span className="inline-flex h-[1.375rem] items-center rounded-full px-2.5 text-xs font-medium" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
              <span className={cn(money, "w-20 text-right text-sm")} style={r.kind === "paid" ? { color: st.fg } : undefined}>{eurFromCents(r.cents)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
