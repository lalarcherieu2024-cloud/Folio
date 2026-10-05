import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { FileList } from "@/components/shared/FilePreview";
import { SubmissionHistory } from "@/components/shared/SubmissionHistory";
import { InterviewCard } from "@/components/student/InterviewCard";
import { SubmitWorkDialog } from "@/components/student/SubmitWorkDialog";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/lib/data/messages";
import { getApplicationDetail } from "@/lib/data/student";
import { getBriefFiles, getSubmissions } from "@/lib/data/submissions";
import { cn } from "@/lib/utils";
import { TONE_CLASS, eur, firstName, statusInfo, weeksLabel } from "@/lib/work";

export const metadata = { title: "Application · Folio" };

// One application: where it stands, the interview if there is one, and messages with the company once hired.
export default async function ApplicationPage(props: PageProps<"/applications/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/applications/${id}`, "student");
  const a = await getApplicationDetail(user, id);
  if (!a) notFound();
  const p = a.project;
  const s = statusInfo(a, p);
  const client = p.orgName ?? firstName(p.clientName);
  const hired = a.status === "accepted" || a.status === "delivered";
  const canMessage = hired && p.clientKind === "company";
  const messages = canMessage ? await getMessages(user, a.id) : [];
  const [briefFiles, submissions] = hired ? await Promise.all([getBriefFiles(p.id), getSubmissions(a.id)]) : [[], []];
  const latest = submissions.at(-1);
  const changes = latest?.status === "changes_requested";
  const canSubmit = a.status === "accepted" && p.status !== "verified";

  return (
    <div className="page-enter flex max-w-[53.75rem] flex-col gap-6">
      <Link href="/applications" className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />My work</Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.025em]">{p.title}</h1>
          <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", TONE_CLASS[s.tone])}>{s.label}</span>
          <div className="ml-auto flex gap-2">
            <Link href={`/projects/${p.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3 text-[0.8125rem]")}>View brief</Link>
            {canSubmit && <SubmitWorkDialog applicationId={a.id} userId={user.id} title={p.title} deliverables={p.deliverables} doneWhen={p.doneWhen} feedback={changes ? latest?.feedback : null} round={latest?.round ?? 0} />}
          </div>
        </div>
        <p className="text-[0.9375rem] text-muted-foreground">{client} · <span className="font-mono">{eur(p.priceEur)}</span> · {weeksLabel(p.weeks)}</p>
      </div>

      {changes && latest?.feedback && (
        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
          <b className="font-semibold">{client} asked for changes</b>
          <p className="mt-1 whitespace-pre-wrap">{latest.feedback}</p>
          <p className="mt-2 text-[0.8125rem]">Update your work, then use <b>Resubmit</b> above.</p>
        </div>
      )}
      {a.status === "delivered" && p.status !== "verified" && (
        <div className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-5 py-4 text-sm text-[#5b21b6]">Submitted. {client} is reviewing your work. You&apos;ll get a notification when they approve it or send feedback.</div>
      )}

      {a.status === "interview" && a.interview && <InterviewCard applicationId={a.id} interview={a.interview} client={client} />}

      {briefFiles.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
          <div className="flex flex-col gap-1"><h2 className="text-base font-semibold">Project files from {client}</h2><p className="text-[0.8125rem] text-muted-foreground">You can preview these here. They can&apos;t be downloaded.</p></div>
          <FileList kind="brief" files={briefFiles} allowDownload={false} />
        </section>
      )}

      <SubmissionHistory submissions={submissions} title="Your submissions" />

      {canMessage ? (
        <ChatPanel applicationId={a.id} userId={user.id} readOnly={p.status === "verified"} messages={messages} otherName={client} intro={`Ask ${client} anything about the project. They'll share extra details here.`} />
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600">
          {a.status === "declined" ? "This project went with another student."
            : hired ? "Messages are available on company projects."
            : `Once ${client} accepts you, you'll be able to message them here.`}
        </p>
      )}
    </div>
  );
}
