import Link from "next/link";
import type { CompanyProject } from "@/lib/data/startup";
import { eur, weeksLabel } from "@/lib/work";
import { hueFor, Pill, StatusPill } from "./ui";

export function CompanyProjectCard({ p }: { p: CompanyProject }) {
  const hue = hueFor(p.category);
  const short = p.summary.length > 120 ? p.summary.slice(0, 117).trimEnd() + "…" : p.summary;
  return (
    <Link href={`/company/projects/${p.id}`} className="card-hover flex flex-col gap-3 rounded-xl border border-t-4 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]" style={{ borderTopColor: hue.solid }}>
      <div className="flex items-center justify-between gap-2">
        <Pill hue={hue} className="text-[13px]">{p.category}</Pill>
        <StatusPill status={p.status} />
      </div>
      <h3 className="text-balance text-base font-semibold leading-snug tracking-tight">{p.title}</h3>
      <p className="text-pretty text-sm leading-normal text-muted-foreground">{short}</p>
      <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <Pill key={s} hue={hue}>{s}</Pill>)}</div>
      <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-3 text-[13px] text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{eur(p.priceEur)}</span>
        <span>{weeksLabel(p.weeks)}</span>
        <span>{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}</span>
      </div>
    </Link>
  );
}
