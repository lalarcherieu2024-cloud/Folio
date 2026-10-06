import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CompanyProject } from "@/lib/data/startup";
import { eur, weeksLabel } from "@/lib/work";
import { CategoryChip, StatusPill } from "./ui";

// The company's own project, laid out like the student ProjectCard.
export function CompanyProjectCard({ p }: { p: CompanyProject }) {
  return (
    <Link href={`/company/projects/${p.id}`} className="card-hover flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between gap-2 text-[0.8125rem] text-muted-foreground">
        <CategoryChip category={p.category} className="truncate" />
        <StatusPill status={p.status} className="shrink-0" />
      </div>
      <h3 className="text-balance text-base font-semibold leading-snug tracking-tight">{p.title}</h3>
      <p className="line-clamp-3 text-pretty text-sm leading-normal text-muted-foreground">{p.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {p.skills.map((s) => <Badge key={s} variant="secondary" className="h-[1.375rem] rounded-md px-2 text-xs font-medium text-zinc-800">{s}</Badge>)}
      </div>
      <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-3 text-[0.8125rem] text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{eur(p.priceEur)}</span>
        <span>{weeksLabel(p.weeks)}</span>
        <span>{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}</span>
      </div>
    </Link>
  );
}
