import { Download } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyLedger, type SpendKind } from "@/lib/data/payments";
import { eurFromCents } from "@/lib/payments/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Payments · Folio" };

const STATUS: Record<SpendKind, [string, string]> = {
  awaiting: ["Awaiting payment", "bg-[#fef3c7] text-[#92400e]"],
  held: ["Held in escrow", "bg-[#e0f2fe] text-[#0c4a6e]"],
  released: ["Released to student", "bg-[#ede9fe] text-[#5b21b6]"],
  paid: ["Paid to student", "bg-[#dcfce7] text-[#166534]"],
  refunded: ["Refunded", "bg-zinc-100 text-zinc-600"],
};
const card = "rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// STARTUP INTERFACE. What you've paid and where each payment is, mirroring the student's Payments page.
export default async function CompanyPayments() {
  const user = await requireUser("/company/payments", "company");
  const l = await getCompanyLedger(user);
  const max = Math.max(...l.months.map((m) => m.value), 1);
  const drafts = l.rows.filter((r) => r.kind === "awaiting").length;

  return (
    <div className="page-enter flex flex-col gap-6">
      <PageHeader title="Payments" sub="You pay when you publish a project. Folio holds the money and pays the student only after you verify their work." />

      {l.mode === "simulated" && <p className="rounded-lg border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-[0.8125rem] text-[#92400e]"><b className="font-semibold">Test mode.</b> No real money moves: payments only update the records.</p>}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4">
        <div className={cn(card, "flex flex-col gap-1.5 p-5")}>
          <span className="text-[0.8125rem] text-muted-foreground">Held for students</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#0c4a6e]">{eurFromCents(l.heldCents)}</span>
          <span className="text-xs text-muted-foreground">Released when you verify their work</span>
        </div>
        <div className={cn(card, "flex flex-col gap-1.5 p-5")}>
          <span className="text-[0.8125rem] text-muted-foreground">Paid to students</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#166534]">{eurFromCents(l.toStudentsCents)}</span>
          <span className="text-xs text-muted-foreground">For work you verified</span>
        </div>
        <div className={cn(card, "flex flex-col gap-1.5 p-5")}>
          <span className="text-[0.8125rem] text-muted-foreground">Total spent</span>
          <span className="font-mono text-[1.75rem] font-semibold">{eurFromCents(l.spentCents)}</span>
          <span className="text-xs text-muted-foreground">Includes {eurFromCents(l.feesCents)} in Folio fees{l.refundedCents ? ` · ${eurFromCents(l.refundedCents)} refunded` : ""}</span>
        </div>
        <Link href="/company/projects?tab=drafts" className={cn(card, "card-hover flex flex-col gap-1.5 p-5")}>
          <span className="text-[0.8125rem] text-muted-foreground">Awaiting payment</span>
          <span className="font-mono text-[1.75rem] font-semibold text-[#92400e]">{eurFromCents(l.awaitingCents)}</span>
          <span className="text-xs text-muted-foreground">{drafts ? `${drafts} draft${drafts === 1 ? "" : "s"} not published yet` : "Nothing waiting"}</span>
        </Link>
      </div>

      <div className={cn(card, "flex flex-col gap-4 p-5")}>
        <div className="flex flex-col gap-1"><span className="text-base font-semibold">Spending by month</span><span className="text-[0.8125rem] text-muted-foreground">Paid, last 6 months (fees included)</span></div>
        <div className="grid h-[8.75rem] grid-cols-6 items-end gap-3">
          {l.months.map((m) => (
            <div key={m.label} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[0.6875rem] text-zinc-600">{m.value ? "€" + Math.round(m.value).toLocaleString("en-GB") : "–"}</span>
              <div className={cn("w-full max-w-12 rounded-t", m.value ? "bg-[#0369a1]" : "bg-zinc-200")} style={{ height: `${Math.max(4, Math.round((m.value / max) * 96))}px` }} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cn(card, "overflow-hidden")}>
        <div className="flex flex-col gap-1 px-5 pb-3 pt-5"><span className="text-base font-semibold">History</span><span className="text-[0.8125rem] text-muted-foreground">Every project payment, newest first</span></div>
        {l.rows.length === 0 ? (
          <div className="border-t border-zinc-100 px-5 py-8 text-sm text-muted-foreground">Nothing here yet. When you publish a project, its payment shows up here.</div>
        ) : l.rows.map((r) => {
          const [label, tone] = STATUS[r.kind];
          return (
            <div key={r.escrowId} className="flex flex-wrap items-center gap-4 border-t border-zinc-100 px-5 py-3.5">
              <div className="flex min-w-[12.5rem] flex-1 flex-col gap-0.5">
                <Link href={`/company/projects/${r.projectId}`} className="text-sm font-medium hover:underline">{r.title}</Link>
                <span className="text-[0.8125rem] text-muted-foreground">{r.student ? `${r.student} · ` : ""}{r.kind === "awaiting" ? "Not paid yet" : day(r.at)}</span>
              </div>
              <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", tone)}>{label}</span>
              <span className="w-24 text-right font-mono text-sm font-semibold">{eurFromCents(r.totalCents)}</span>
              {r.kind === "awaiting" ? (
                <Link href={`/company/projects/${r.projectId}/pay`} className="inline-flex h-8 w-24 items-center justify-center rounded-md bg-primary text-[0.8125rem] font-medium text-primary-foreground">Pay</Link>
              ) : (
                <a href={`/api/payments/${r.escrowId}/receipt`} className="inline-flex h-8 w-24 items-center justify-center gap-1.5 rounded-md border bg-white text-[0.8125rem] font-medium hover:bg-muted"><Download className="size-3.5" />Receipt</a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
