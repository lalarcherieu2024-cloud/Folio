"use client";

import { ArrowRight, Check, Clock, Heart, Sparkles, Sprout, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleSavedAction } from "@/app/actions/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur, weeksLabel, whyFits, type Viewer } from "@/lib/work";

// One project at a time: Skip it or Save it to your shortlist. Left arrow = skip, right arrow = save.
export function QuickMatch({ projects, viewer }: { projects: Project[]; viewer: Viewer }) {
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState<"skip" | "save" | null>(null);
  const [savedNow, setSavedNow] = useState(0);
  const [, start] = useTransition();
  const p = projects[i];

  const decide = useCallback((kind: "skip" | "save") => {
    if (!p || leaving) return;
    setLeaving(kind);
    if (kind === "save") {
      setSavedNow((n) => n + 1);
      start(async () => { const r = await toggleSavedAction(p.id, true); if (r.error) toast.error(r.error); });
    }
    setTimeout(() => { setI((n) => n + 1); setLeaving(null); }, 260);
  }, [p, leaving]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft") decide("skip");
      if (e.key === "ArrowRight") decide("save");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  if (!p) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
        <span className="text-base font-semibold">You&apos;ve seen them all</span>
        <span className="text-muted-foreground">{savedNow ? `You saved ${savedNow} project${savedNow === 1 ? "" : "s"} to your shortlist.` : "Nothing new right now. Check back soon."}</span>
        <div className="flex gap-2">
          <Link href="/projects?saved=1" className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">See my shortlist</Link>
          <button type="button" onClick={() => setI(0)} className="inline-flex h-9 items-center rounded-md border bg-white px-3.5 text-sm font-medium hover:bg-muted">Start over</button>
        </div>
      </div>
    );
  }

  const fit = whyFits(p, viewer);
  const mine = new Set(viewer.skills);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between text-[0.8125rem] text-muted-foreground">
        <span>Project <span className="font-mono">{i + 1}</span> of <span className="font-mono">{projects.length}</span></span>
        <span className="hidden sm:inline">Use the ← → keys</span>
      </div>
      <article
        key={p.id}
        className={cn(
          "flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-[0_12px_32px_-16px_rgba(0,0,0,.25)] transition-all duration-[260ms] ease-out",
          !leaving && "pop-card",
          leaving === "skip" && "-translate-x-24 -rotate-6 opacity-0",
          leaving === "save" && "translate-x-24 rotate-6 opacity-0",
        )}
      >
        <div className="flex items-center justify-between gap-2 text-[0.8125rem] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="font-medium text-foreground">{p.orgName ?? p.clientName}</span>{p.orgVerified && <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} />}<span>· {p.hood}</span></span>
          <Badge variant={p.clientKind === "company" ? "outline" : "secondary"} className="h-[1.375rem] rounded-md px-2 text-xs font-medium">{p.clientKind === "company" ? "Company" : "Student"}</Badge>
        </div>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">{p.title}</h2>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{p.summary}</p>
        {fit && <p className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#f0fdf4] px-3 py-1.5 text-sm font-medium text-[#166534]"><Sparkles className="size-4" />{fit}</p>}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="rounded-md px-2 text-xs font-medium">{p.category}</Badge>
          {p.skills.map((s) => {
            const m = mine.has(s.toLowerCase());
            return <Badge key={s} variant="secondary" className={cn("gap-1 rounded-md px-2 text-xs font-medium", m ? "border border-[#bbf7d0] bg-[#dcfce7] text-[#166534]" : "text-zinc-800")}>{m && <Check className="size-3" strokeWidth={3} />}{s}</Badge>;
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-4 text-sm text-muted-foreground">
          <span className="font-mono text-base font-semibold text-foreground">{eur(p.priceEur)}</span>
          <span>{weeksLabel(p.weeks)}</span>
          {p.hoursPerWeek && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />~{p.hoursPerWeek} h/week</span>}
          {p.beginnerFriendly && <span className="inline-flex items-center gap-1 font-medium text-[#166534]"><Sprout className="size-3.5" />Good first project</span>}
        </div>
        {p.learn.length > 0 && <p className="text-sm text-muted-foreground">You&apos;ll learn: <span className="font-medium text-foreground">{p.learn.join(", ")}</span></p>}
        <Link href={`/projects/${p.id}`} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">See the full project <ArrowRight className="size-3.5" /></Link>
      </article>
      <div className="flex items-center justify-center gap-4">
        <Button type="button" variant="outline" onClick={() => decide("skip")} className="h-12 gap-2 rounded-full bg-white px-6 text-sm"><X className="size-4" />Skip</Button>
        <Button type="button" onClick={() => decide("save")} className="h-12 gap-2 rounded-full px-6 text-sm"><Heart className="size-4" />Save</Button>
      </div>
    </div>
  );
}
