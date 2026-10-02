"use client";

import { Check, ExternalLink, FileText } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { acceptApplicantAction, declineApplicantAction } from "@/app/actions/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Applicant, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/work";

const chip = "h-[1.375rem] gap-1 rounded-md px-2 text-xs font-medium";

function FileLink({ name, url, sizeKb }: { name: string; url: string | null; sizeKb: number }) {
  const body = (<><FileText className="size-3.5 shrink-0" /><span className="truncate">{name}</span><span className="text-muted-foreground">{sizeKb} KB</span></>);
  const cls = "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border bg-white px-2.5 text-[0.8125rem] font-medium";
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" className={cn(cls, "hover:bg-muted")}>{body}<ExternalLink className="size-3 text-muted-foreground" /></a>
    : <span className={cn(cls, "text-muted-foreground")} title="Couldn't open this file">{body}</span>;
}

function ApplicantCard({ a, project }: { a: Applicant; project: Project }) {
  const [pending, start] = useTransition();
  const open = project.status === "open";
  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.error) toast.error(r.error); else toast.success(ok); });
  const total = project.skills.length;
  const accepted = a.status === "accepted", declined = a.status === "declined";

  return (
    <article className={cn("flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]", accepted && "border-[#16a34a] shadow-[inset_4px_0_0_#16a34a]", declined && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-zinc-200 text-sm font-semibold">{initials(a.student.fullName)}</span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-base font-semibold leading-tight">{a.student.fullName}</span>
            <span className="text-[0.8125rem] text-muted-foreground">{a.student.program || "IE student"}{a.student.topField ? ` · strongest in ${a.student.topField}` : ""}</span>
            <div className="flex flex-wrap gap-1.5">
              {a.student.githubVerified && <Badge className={cn(chip, "bg-[#dcfce7] text-[#166534] hover:bg-[#dcfce7]")}><Check className="size-3" strokeWidth={3} />GitHub @{a.student.githubHandle}</Badge>}
              {a.student.linkedinVerified && <Badge className={cn(chip, "bg-[#dcfce7] text-[#166534] hover:bg-[#dcfce7]")}><Check className="size-3" strokeWidth={3} />LinkedIn verified</Badge>}
            </div>
          </div>
        </div>
        {accepted && <Badge className={cn(chip, "bg-[#dcfce7] text-[#166534] hover:bg-[#dcfce7]")}>Working on it</Badge>}
        {declined && <Badge variant="outline" className={cn(chip, "text-muted-foreground")}>Declined</Badge>}
        {a.status === "pending" && open && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => declineApplicantAction(a.applicationId, project.id), "Applicant declined")} className="h-8 bg-white px-3 text-[0.8125rem]">Decline</Button>
            <Button size="sm" disabled={pending} onClick={() => run(() => acceptApplicantAction(a.applicationId, project.id), `${a.student.fullName.split(" ")[0]} is now working on this`)} className="h-8 px-3 text-[0.8125rem]">Accept</Button>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[0.8125rem] text-muted-foreground">Skills you asked for: <span className="font-medium text-foreground">{a.matchedSkills.length} of {total}</span></span>
          {project.skills.map((s) => {
            const match = a.matchedSkills.includes(s);
            return <Badge key={s} variant="secondary" className={cn(chip, match ? "border border-[#bbf7d0] bg-[#dcfce7] text-[#166534]" : "text-zinc-500")}>{match && <Check className="size-3" strokeWidth={3} />}{s}</Badge>;
          })}
        </div>
      )}

      <p className={cn("rounded-lg bg-panel px-3.5 py-3 text-sm", a.pitch ? "text-zinc-700" : "italic text-muted-foreground")}>{a.pitch || "No note, just the CV."}</p>

      <div className="flex flex-wrap gap-2">
        {a.cv ? <FileLink name={a.cv.name} url={a.cv.url} sizeKb={a.cv.sizeKb} /> : <span className="text-[0.8125rem] text-muted-foreground">No CV on file.</span>}
        {a.files.map((f) => <FileLink key={f.id} name={f.name} url={f.url} sizeKb={f.sizeKb} />)}
        {!a.includeFiles && <span className="inline-flex h-8 items-center text-xs text-muted-foreground">Additional files not shared</span>}
      </div>
    </article>
  );
}

export function RequestApplicants({ applicants, project }: { applicants: Applicant[]; project: Project }) {
  const working = applicants.find((a) => a.status === "accepted");
  const list = working ? [working, ...applicants.filter((a) => a !== working)] : applicants;
  if (list.length === 0) {
    return <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-sm text-muted-foreground">No one has applied yet. Students who apply will show up here with their CV and skills.</div>;
  }
  return <div className="stagger flex flex-col gap-3">{list.map((a) => <ApplicantCard key={a.applicationId} a={a} project={project} />)}</div>;
}
