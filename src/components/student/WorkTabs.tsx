"use client";

import { ArrowRight, Briefcase, Check, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { withdrawApplicationAction } from "@/app/actions/student";
import { InterviewCard } from "@/components/student/InterviewCard";
import { SubmitWorkDialog } from "@/components/student/SubmitWorkDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Submission } from "@/lib/data/submissions";
import type { Application, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TONE_CLASS, dueInfo, eur, firstName, stageColors, statusInfo, weeksLabel } from "@/lib/work";

type Row = Application & { project: Project };

const clientOf = (p: Project) => p.orgName ?? firstName(p.clientName);

function note(a: Row, latest?: Submission) {
  const client = clientOf(a.project);
  const s = statusInfo(a, a.project);
  if (s.stage === "building" && latest?.status === "changes_requested") return `${client} asked for changes${latest.feedback ? `: “${latest.feedback}”` : "."} Fix them and resubmit.`;
  if (s.stage === "applied") return `${client} is reviewing ${a.project.applicantCount} application${a.project.applicantCount === 1 ? "" : "s"}. Most clients reply within 3 days.`;
  if (s.stage === "interview") return `${client} wants to meet you before deciding. Confirm the time below, then they'll accept you or let you know.`;
  if (s.stage === "building") return `Done when: ${a.project.doneWhen}`;
  if (s.stage === "delivered") return `Submitted. ${client} checks it against “done when”, then signs your credential or sends feedback.`;
  if (s.stage === "verified") return `Verified. This credential is now on your public record.`;
  return "This project went with another student. Your CV stays on file for the next one.";
}

function AppCard({ a, userId, latest }: { a: Row; userId: string; latest?: Submission }) {
  const [pending, start] = useTransition();
  const base = statusInfo(a, a.project);
  const changes = base.stage === "building" && latest?.status === "changes_requested";
  const s = changes ? { ...base, label: "Changes requested", tone: "warning" as const } : base;
  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.error) toast.error(r.error); else toast.success(ok); });
  const [ring, fg] = stageColors(s.stage);
  const due = s.stage === "building" ? dueInfo(a.acceptedAt, a.project.weeks) : null;
  // The message channel exists for company projects once you're hired.
  const canMessage = a.project.clientKind === "company" && (a.status === "accepted" || a.status === "delivered");
  const hired = a.status === "accepted" || a.status === "delivered";
  const date = new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="flex flex-col gap-[1.125rem] rounded-xl border bg-white p-5" style={{ boxShadow: `inset 4px 0 0 ${ring}, 0 1px 2px rgba(0,0,0,.04)` }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-semibold">{a.project.title}</span>
            <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", TONE_CLASS[s.tone])}>{s.label}</span>
          </div>
          <span className="text-[0.8125rem] text-muted-foreground">{a.project.orgName ?? a.project.clientName} · {eur(a.project.priceEur)} · {weeksLabel(a.project.weeks)} · applied {date}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${a.projectId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3 text-[0.8125rem]")}>View brief</Link>
          {hired && <Link href={`/applications/${a.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5 bg-white px-3 text-[0.8125rem]")}><MessageSquare className="size-3.5" />{canMessage ? "Messages & files" : "Files"}</Link>}
          {a.status === "accepted" && base.stage === "building" && (
            <SubmitWorkDialog applicationId={a.id} userId={userId} title={a.project.title} deliverables={a.project.deliverables} doneWhen={a.project.doneWhen}
              feedback={changes ? latest?.feedback : null} round={latest?.round ?? 0} />
          )}
          {(a.status === "pending" || a.status === "interview") && <Button size="sm" variant="ghost" disabled={pending} className="h-8 px-3 text-[0.8125rem] text-destructive hover:bg-red-50 hover:text-destructive" onClick={() => run(() => withdrawApplicationAction(a.id), "Application withdrawn")}>Withdraw</Button>}
        </div>
      </div>
      {due && (
        <p className={cn("inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.8125rem] font-medium", due.tone === "late" ? "bg-[#fee2e2] text-[#991b1b]" : due.tone === "soon" ? "bg-[#fef3c7] text-[#92400e]" : "bg-muted text-zinc-700")}><Clock className="size-3.5" />{due.label}</p>
      )}
      {a.status === "interview" && a.interview && <InterviewCard applicationId={a.id} interview={a.interview} client={clientOf(a.project)} />}
      {s.step >= 0 && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${s.steps.length}, minmax(0, 1fr))` }}>
          {s.steps.map((label, i) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="h-1.5 rounded-full" style={{ background: i <= s.step ? ring : "#dde7ee", boxShadow: i === s.step ? `0 0 0 3px ${ring}22` : "none" }} />
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: i <= s.step ? fg : "#94a3b8", fontWeight: i === s.step ? 600 : 500 }}>
                {i < s.step && <Check className="size-[0.6875rem]" strokeWidth={3} />}{label}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className={cn("rounded-lg px-3.5 py-3 text-[0.8125rem]", changes ? "bg-[#fffbeb] text-[#92400e]" : "bg-panel text-zinc-600")}>{note(a, latest)}</p>
    </div>
  );
}

export function WorkTabs({ apps, tab, userId, submissions }: { apps: Row[]; tab: "applications" | "past"; userId: string; submissions: Record<string, Submission> }) {
  // Active = still moving (applied, interview, building, delivered). Past = finished (verified) or not selected.
  const isPast = (a: Row) => { const stage = statusInfo(a, a.project).stage; return stage === "verified" || stage === "declined"; };
  const active = apps.filter((a) => !isPast(a));
  const past = apps.filter(isPast);
  return (
    <Tabs defaultValue={tab} className="gap-5">
      <TabsList className="h-9 self-start">
        <TabsTrigger value="applications" className="px-3 text-[0.8125rem]">Active · {active.length}</TabsTrigger>
        <TabsTrigger value="past" className="px-3 text-[0.8125rem]">Past · {past.length}</TabsTrigger>
      </TabsList>
      <TabsContent value="applications" className="flex flex-col gap-3">
        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 bg-white/60 px-6 py-14 text-center">
            <span className="empty-icon grid size-12 place-items-center rounded-full bg-soft text-brand"><Briefcase className="size-5" /></span>
            <span className="text-xl font-semibold tracking-tight">{apps.length === 0 ? "You have no work yet!" : "Nothing active right now"}</span>
            {apps.length > 0 && <span className="-mt-2 text-muted-foreground">Your finished projects are under Past.</span>}
            <Link href="/projects" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>Find projects <ArrowRight className="size-4" /></Link>
          </div>
        ) : active.map((a) => <AppCard key={a.id} a={a} userId={userId} latest={submissions[a.id]} />)}
      </TabsContent>
      <TabsContent value="past" className="flex flex-col gap-3">
        {past.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
            <span className="text-base font-semibold">No past projects yet</span>
            <span className="text-muted-foreground">Verified projects and applications that weren&apos;t selected end up here.</span>
          </div>
        ) : past.map((a) => <AppCard key={a.id} a={a} userId={userId} latest={submissions[a.id]} />)}
      </TabsContent>
    </Tabs>
  );
}
