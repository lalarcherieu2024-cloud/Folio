import { ArrowRight, Check, Clock, Sparkles, Sprout } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/student/SaveButton";
import { eur, weeksLabel, whyFits, type Viewer } from "@/lib/work";
import type { Project } from "@/lib/types";

export const kindLabel = (p: Project) => (p.clientKind === "company" ? "Company" : "Student");

export function ProjectCard({ p, applied, href, viewer }: { p: Project; applied?: boolean; href?: string; viewer?: Viewer }) {
  const mine = new Set(viewer?.skills ?? []);
  const canApply = !applied && (!viewer?.id || p.postedById !== viewer.id);
  const fit = viewer ? whyFits(p, viewer) : null;
  return (
    <Link href={href ?? `/projects/${p.id}`} scroll={false} className="card-hover flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between gap-2 text-[0.8125rem] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate font-medium text-foreground">{p.orgName ?? p.clientName}</span>
          {p.orgVerified && <Check className="size-3.5 shrink-0 text-[#16a34a]" strokeWidth={2.5} aria-label="Verified" />}
          <span className="truncate">· {p.hood}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Badge variant={p.clientKind === "company" ? "outline" : "secondary"} className="h-[1.375rem] rounded-md px-2 text-xs font-medium">{kindLabel(p)}</Badge>
          {viewer?.id && <SaveButton projectId={p.id} initial={viewer.saved.includes(p.id)} />}
        </span>
      </div>
      <h3 className="text-balance text-base font-semibold leading-snug tracking-tight">{p.title}</h3>
      <p className="text-pretty text-sm leading-normal text-muted-foreground">{p.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {p.skills.map((s) => {
          const match = mine.has(s.toLowerCase());
          return (
            <Badge key={s} variant="secondary" title={match ? "On your profile" : "Not on your profile yet"} className={`h-[1.375rem] gap-1 rounded-md px-2 text-xs font-medium ${match ? "border border-[#bbf7d0] bg-[#dcfce7] text-[#166534]" : "text-zinc-800"}`}>
              {match && <Check className="size-[0.6875rem]" strokeWidth={3} />}{s}
            </Badge>
          );
        })}
      </div>
      {(p.hoursPerWeek || p.beginnerFriendly) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {p.hoursPerWeek && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />~{p.hoursPerWeek} h/week</span>}
          {p.beginnerFriendly && <span className="inline-flex items-center gap-1 font-medium text-[#166534]"><Sprout className="size-3.5" />Good first project</span>}
        </div>
      )}
      {p.learn.length > 0 && <p className="text-xs text-muted-foreground">You&apos;ll learn: <span className="font-medium text-zinc-700">{p.learn.join(", ")}</span></p>}
      {fit && <p className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[#166534]"><Sparkles className="size-3.5" />{fit}</p>}
      <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-3 text-[0.8125rem] text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">{eur(p.priceEur)}</span>
        <span>{weeksLabel(p.weeks)}</span>
        <span>{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}</span>
        {applied && <span className="ml-auto inline-flex h-[1.375rem] items-center gap-1 rounded-md border border-[#bbf7d0] bg-[#dcfce7] px-2 text-xs font-medium text-[#166534]"><Check className="size-[0.6875rem]" strokeWidth={3} />Applied</span>}
        {canApply && <span className="ml-auto inline-flex h-[1.875rem] items-center gap-1.5 rounded-md bg-primary px-3 text-[0.8125rem] font-medium text-primary-foreground">Apply<ArrowRight className="size-[0.8125rem]" strokeWidth={2.5} /></span>}
      </div>
    </Link>
  );
}
