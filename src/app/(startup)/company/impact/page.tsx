import { Star } from "lucide-react";
import { ActivityHeatmap } from "@/components/student/ActivityHeatmap";
import { MilestoneGrid } from "@/components/student/Milestones";
import { PageHeader } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyLedger } from "@/lib/data/payments";
import { companyMilestones, getCompanyImpact } from "@/lib/data/startup";
import { eurFromCents } from "@/lib/payments/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Impact · Folio" };

const card = "rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

// STARTUP INTERFACE. The company's "Progress": what working with students has added up to.
export default async function CompanyImpact() {
  const user = await requireUser("/company/impact", "company");
  const [impact, ledger] = await Promise.all([getCompanyImpact(user), getCompanyLedger(user)]);
  const stats: { label: string; value: React.ReactNode; sub: string; edge: string }[] = [
    { label: "Projects completed", value: impact.completed, sub: `${impact.published} published in total`, edge: "#22c55e" },
    { label: "Students worked with", value: impact.studentsWorkedWith, sub: "Different students you hired", edge: "#0369a1" },
    { label: "Average rating you gave", value: impact.avgRatingGiven === null ? "–" : <span className="inline-flex items-center gap-1.5">{impact.avgRatingGiven.toFixed(1)}<Star className="size-5 fill-[#f59e0b] text-[#f59e0b]" /></span>, sub: `${impact.certificatesIssued} certificate${impact.certificatesIssued === 1 ? "" : "s"} issued`, edge: "#f59e0b" },
    { label: "Time to hire", value: impact.avgDaysToHire === null ? "–" : `${Math.max(1, Math.round(impact.avgDaysToHire))} d`, sub: "From posting to accepting someone", edge: "#8b5cf6" },
    { label: "Invested in students", value: eurFromCents(ledger.toStudentsCents + ledger.heldCents), sub: `${eurFromCents(ledger.toStudentsCents)} already paid out`, edge: "#64748b" },
  ];

  return (
    <div className="page-enter flex flex-col gap-10">
      <PageHeader title="Impact" sub="How working with IE students adds up: your activity week by week, and the milestones you’ve reached." />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12.5rem),1fr))] gap-4">
        {stats.map((s) => (
          <div key={s.label} className={cn(card, "flex flex-col gap-1.5 p-5")}>
            <span className="text-[0.8125rem] text-muted-foreground">{s.label}</span>
            <span className="font-mono text-[1.75rem] font-semibold">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </div>

      <ActivityHeatmap dates={impact.activity} empty="Your activity shows up here as you post, hire and verify." />
      <MilestoneGrid list={companyMilestones(impact)} />
    </div>
  );
}
