import { Landmark } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPayments, type PayKind } from "@/lib/data/student";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/work";

export const metadata = { title: "Payments · Folio" };

const STATUS: Record<PayKind, [string, string]> = {
  paid: ["Paid", "bg-[#dcfce7] text-[#166534]"],
  escrow: ["Held in escrow", "bg-[#e0f2fe] text-[#0c4a6e]"],
  review: ["Releases on verification", "bg-[#ede9fe] text-[#5b21b6]"],
};
const card = "rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

export default async function PaymentsPage() {
  const user = await requireUser("/payments", "student");
  const pay = await getPayments(user);
  const max = Math.max(...pay.months.map((m) => m.value), 1);

  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Payments</h1>
        <p className="max-w-[64ch] text-[0.9375rem] text-muted-foreground">What you&apos;ve earned, and what&apos;s on the way. Clients pay into escrow when you start; it&apos;s released when they verify your work.</p>
      </div>

      <p className="rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600">Payments go live with the company side. Until then these are the agreed project prices and where each one stands.</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4">
        <div className={cn(card, "flex flex-col gap-1.5 p-5 shadow-[inset_0_3px_0_#22c55e]")}>
          <span className="text-[0.8125rem] text-muted-foreground">Total earned</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#166534]">{eur(pay.earned)}</span>
          <span className="text-xs text-muted-foreground">{pay.paidCount} payout{pay.paidCount === 1 ? "" : "s"}</span>
        </div>
        <div className={cn(card, "flex flex-col gap-1.5 p-5 shadow-[inset_0_3px_0_#0369a1]")}>
          <span className="text-[0.8125rem] text-muted-foreground">On the way</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#0c4a6e]">{eur(pay.escrow + pay.review)}</span>
          <span className="text-xs text-muted-foreground">{eur(pay.escrow)} in escrow · {eur(pay.review)} awaiting sign-off</span>
        </div>
        <div className={cn(card, "flex flex-col gap-2.5 p-5")}>
          <span className="text-[0.8125rem] text-muted-foreground">Payout account</span>
          <div className="flex items-center gap-2.5">
            <span className="grid h-[1.625rem] w-9 place-items-center rounded-[5px] bg-primary text-primary-foreground"><Landmark className="size-3.5" /></span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{user.payoutLink ? user.payoutLink.replace(/^https:\/\/(www\.)?/, "") : "Not added yet"}</span>
              <span className="text-xs text-muted-foreground">{user.payoutLink ? "PayPal" : "Add your PayPal link to get paid."}</span>
            </div>
          </div>
          <Link href="/profile" className="self-start text-[0.8125rem] font-medium underline underline-offset-4">{user.payoutLink ? "Edit" : "Add PayPal link"}</Link>
        </div>
      </div>

      <div className={cn(card, "flex flex-col gap-4 p-5")}>
        <div className="flex flex-col gap-1"><span className="text-base font-semibold">Earnings by month</span><span className="text-[0.8125rem] text-muted-foreground">Paid out, last 6 months</span></div>
        <div className="grid h-[8.75rem] grid-cols-6 items-end gap-3">
          {pay.months.map((m) => (
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
        {pay.rows.length === 0 ? (
          <div className="border-t border-zinc-100 px-5 py-8 text-sm text-muted-foreground">Nothing here yet. Once a client accepts you, the project shows up as &ldquo;Held in escrow&rdquo;.</div>
        ) : pay.rows.map((r) => {
          const [label, tone] = STATUS[r.kind];
          return (
            <div key={r.projectId} className="flex flex-wrap items-center gap-4 border-t border-zinc-100 px-5 py-3.5">
              <div className="flex min-w-[12.5rem] flex-1 flex-col gap-0.5"><span className="text-sm font-medium">{r.title}</span><span className="text-[0.8125rem] text-muted-foreground">{r.org} · {r.date}</span></div>
              <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", tone)}>{label}</span>
              <span className={cn("w-20 text-right font-mono text-sm font-semibold", r.kind === "paid" && "text-[#166534]")}>{eur(r.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
