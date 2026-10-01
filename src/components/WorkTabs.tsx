"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { markDeliveredAction, withdrawApplicationAction } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Application, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STEPS, TONE_CLASS, eur, firstName, statusInfo, weeksLabel } from "@/lib/work";

type Row = Application & { project: Project };

function note(a: Row) {
  const client = firstName(a.project.clientName);
  const s = statusInfo(a, a.project);
  if (s.step === 0) return `${client} is reviewing ${a.project.applicantCount} application${a.project.applicantCount === 1 ? "" : "s"}. Most clients reply within 3 days.`;
  if (s.step === 2) return `Done when: ${a.project.doneWhen}`;
  if (s.step === 3) return `Delivered. ${client} checks it against “done when”, then signs your credential.`;
  if (s.step === 4) return `Verified. This credential is now on your public record.`;
  return "This project went with another student. Your CV stays on file for the next one.";
}

function AppCard({ a }: { a: Row }) {
  const [pending, start] = useTransition();
  const s = statusInfo(a, a.project);
  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.error) toast.error(r.error); else toast.success(ok); });
  const date = new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="flex flex-col gap-[18px] rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-semibold">{a.project.title}</span>
            <span className={cn("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium", TONE_CLASS[s.tone])}>{s.label}</span>
          </div>
          <span className="text-[13px] text-muted-foreground">{a.project.orgName ?? a.project.clientName} · {eur(a.project.priceEur)} · {weeksLabel(a.project.weeks)} · applied {date}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects?project=${a.projectId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3 text-[13px]")}>View brief</Link>
          {a.status === "accepted" && s.step === 2 && <Button size="sm" disabled={pending} className="h-8 px-3 text-[13px]" onClick={() => run(() => markDeliveredAction(a.id), "Marked as delivered")}>Mark as delivered</Button>}
          {a.status === "pending" && <Button size="sm" variant="ghost" disabled={pending} className="h-8 px-3 text-[13px] text-destructive hover:bg-red-50 hover:text-destructive" onClick={() => run(() => withdrawApplicationAction(a.id), "Application withdrawn")}>Withdraw</Button>}
        </div>
      </div>
      {s.step >= 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="h-1.5 rounded-full" style={{ background: i <= s.step ? "#18181b" : "#e4e4e7" }} />
              <span className={cn("text-xs", i === s.step ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
            </div>
          ))}
        </div>
      )}
      <p className="rounded-lg bg-panel px-3.5 py-3 text-[13px] text-zinc-600">{note(a)}</p>
    </div>
  );
}

export function WorkTabs({ apps, requests, tab, posted }: { apps: Row[]; requests: Project[]; tab: "applications" | "requests"; posted: boolean }) {
  useEffect(() => { if (posted) toast.success("Request posted", { description: "Every IE student can see it now." }); }, [posted]);
  return (
    <Tabs defaultValue={tab} className="gap-5">
      <TabsList className="h-9 self-start">
        <TabsTrigger value="applications" className="px-3 text-[13px]">Applications · {apps.length}</TabsTrigger>
        <TabsTrigger value="requests" className="px-3 text-[13px]">My requests · {requests.length}</TabsTrigger>
      </TabsList>
      <TabsContent value="applications" className="flex flex-col gap-3">
        {apps.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
            <span className="text-base font-semibold">No applications yet</span>
            <span className="text-muted-foreground">Find a project that fits and send a short pitch.</span>
            <Link href="/projects" className={cn(buttonVariants(), "h-9 px-3.5")}>Find projects</Link>
          </div>
        ) : apps.map((a) => <AppCard key={a.id} a={a} />)}
      </TabsContent>
      <TabsContent value="requests" className="flex flex-col gap-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
            <span className="text-base font-semibold">No requests yet</span>
            <span className="text-muted-foreground">Describe an idea and another student picks it up.</span>
            <Link href="/projects/new" className={cn(buttonVariants(), "h-9 px-3.5")}>Request help</Link>
          </div>
        ) : requests.map((p) => (
          <Link key={p.id} href={`/projects?project=${p.id}`} className="card-hover flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
            <span className="text-base font-semibold">{p.title}</span>
            <span className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <span>{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}</span><span className="font-mono font-semibold text-foreground">{eur(p.priceEur)}</span>
              <span className="inline-flex h-[22px] items-center rounded-md bg-[#dcfce7] px-2 text-xs font-medium text-[#166534]">Open</span>
            </span>
          </Link>
        ))}
      </TabsContent>
    </Tabs>
  );
}
