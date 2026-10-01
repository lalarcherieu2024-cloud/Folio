import { Check } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { eur, weeksLabel } from "@/lib/work";
import type { Project } from "@/lib/types";

export const kindLabel = (p: Project) => (p.clientKind === "company" ? "Company" : "Student");

export function ProjectCard({ p, applied, href }: { p: Project; applied?: boolean; href?: string }) {
  return (
    <Link href={href ?? `/projects?project=${p.id}`} scroll={false} className="card-hover flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate font-medium text-foreground">{p.orgName ?? p.clientName}</span>
          {p.orgVerified && <Check className="size-3.5 shrink-0 text-[#16a34a]" strokeWidth={2.5} aria-label="Verified" />}
          <span className="truncate">· {p.hood}</span>
        </span>
        <Badge variant={p.clientKind === "company" ? "outline" : "secondary"} className="h-[22px] shrink-0 rounded-md px-2 text-xs font-medium">{kindLabel(p)}</Badge>
      </div>
      <h3 className="text-balance text-base font-semibold leading-snug tracking-tight">{p.title}</h3>
      <p className="text-pretty text-sm leading-normal text-muted-foreground">{p.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {p.skills.map((s) => <Badge key={s} variant="secondary" className="h-[22px] rounded-md px-2 text-xs font-medium text-zinc-800">{s}</Badge>)}
      </div>
      <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-3 text-[13px] text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{eur(p.priceEur)}</span>
        <span>{weeksLabel(p.weeks)}</span>
        <span>{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}</span>
        {applied && <Badge className="ml-auto h-[22px] rounded-md px-2 text-xs font-medium">Applied</Badge>}
      </div>
    </Link>
  );
}
