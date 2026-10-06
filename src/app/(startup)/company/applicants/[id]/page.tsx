import { ArrowLeft, Check, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { CredentialCard } from "@/components/shared/CredentialCard";
import { SignCertificateDialog } from "@/components/shared/SignCertificateDialog";
import { SubmissionHistory } from "@/components/shared/SubmissionHistory";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ApplicantActions } from "@/components/startup/ApplicantActions";
import { InterviewSummary } from "@/components/startup/InterviewSummary";
import { ago, card, chip, TONES } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/lib/data/messages";
import { getApplicant } from "@/lib/data/startup";
import { getCertificates } from "@/lib/data/student";
import { CertificateRow } from "@/components/student/CertificatesCard";
import { getCredentialForProject } from "@/lib/data/signatures";
import { getSubmissions } from "@/lib/data/submissions";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/work";

export const metadata = { title: "Applicant · Folio" };

const fileLink = "inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border bg-white px-2.5 text-[0.8125rem] font-medium hover:bg-muted";

// STARTUP INTERFACE (owner: startup builder).
export default async function ApplicantProfile(props: PageProps<"/company/applicants/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/company/applicants/${id}`, "company");
  const a = await getApplicant(user, id);
  if (!a) notFound();
  // Once the student is hired, the two can message each other.
  const hired = a.status === "accepted" || a.status === "delivered";
  const messages = hired ? await getMessages(user, a.id) : [];
  const submissions = hired ? await getSubmissions(a.id) : [];
  const certificate = a.projectStatus === "verified" ? await getCredentialForProject(a.projectId) : null;
  const courses = await getCertificates(a.studentId); // certificates from courses outside Folio

  return (
    <div className="page-enter flex max-w-[60rem] flex-col gap-6">
      <Link href={`/company/applicants?project=${a.projectId}`} className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Applicants</Link>

      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar name={a.name} color={a.avatarColor} url={a.avatarUrl} className="size-14 rounded-xl text-lg" />
        <div className="flex min-w-[13.75rem] flex-1 flex-col gap-1.5">
          <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.025em]">{a.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
            {a.program && <span className="mr-1">{a.program}</span>}
            {a.uniEmailVerified && <span className={cn(chip, TONES.success)}><Check className="size-3" strokeWidth={3} />IE email</span>}
            {a.githubVerified && <span className={cn(chip, TONES.success)}><Check className="size-3" strokeWidth={3} />GitHub</span>}
            {a.linkedinVerified && <span className={cn(chip, TONES.success)}><Check className="size-3" strokeWidth={3} />LinkedIn</span>}
          </div>
        </div>
        <ApplicantActions a={a} size="lg" />
      </div>

      <Link href={`/company/projects/${a.projectId}`} className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600 hover:border-zinc-400">
        Applied to <span className="font-medium text-foreground">{a.projectTitle}</span> · {ago(a.createdAt)}
      </Link>

      {a.status === "interview" && a.interview && <InterviewSummary interview={a.interview} name={firstName(a.name)} />}

      {a.status === "delivered" && a.projectStatus !== "verified" && (
        <div className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-5 py-4 text-sm text-[#5b21b6]">
          <b className="font-semibold">{firstName(a.name)} submitted their work.</b> Open the files below, then approve it to issue their credential, or send it back with feedback.
        </div>
      )}
      {certificate && !certificate.clientSignedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-4 text-sm text-[#166534]">
          <span><b className="font-semibold">{firstName(a.name)}&apos;s certificate is waiting for your signature.</b> It is issued, but it only counts as signed once you add yours.</span>
          <SignCertificateDialog credentialId={certificate.credentialId} as="company" project={a.projectTitle} otherParty={firstName(a.name)} />
        </div>
      )}
      {certificate?.clientSignedAt && (
        <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3 text-sm text-[#166534]">
          Certificate signed by you{certificate.studentSignedAt ? ` and by ${firstName(a.name)}.` : `. ${firstName(a.name)} signs it next.`}
        </div>
      )}
      <SubmissionHistory submissions={submissions} title="Submitted work" />

      {hired && <ChatPanel applicationId={a.id} userId={user.id} readOnly={a.projectStatus === "verified"} messages={messages} otherName={firstName(a.name)} intro="Share extra information, links or files they'll need, and answer their questions here." />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={cn(card, "flex flex-col gap-5 p-5")}>
          <div>
            <h2 className="text-sm font-semibold">Their note</h2>
            <p className={cn("mt-2 rounded-lg bg-panel px-3.5 py-3 text-sm", a.pitch ? "whitespace-pre-wrap text-zinc-700" : "italic text-muted-foreground")}>{a.pitch || "No note, just the CV."}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">CV</h2>
            <div className="mt-2">
              {a.cv ? (
                <a href={`/company/applicants/${a.id}/cv`} target="_blank" rel="noopener noreferrer" className={fileLink}>
                  <FileText className="size-3.5 shrink-0" /><span className="truncate">{a.cv.fileName}</span><span className="text-muted-foreground">{a.cv.sizeKb} KB</span><ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : <span className="text-[0.8125rem] text-muted-foreground">No CV on file.</span>}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Links</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={fileLink}><span className="truncate">{l.label}</span><ExternalLink className="size-3 text-muted-foreground" /></a>)}
              {a.links.length === 0 && <span className="text-[0.8125rem] text-muted-foreground">No links added.</span>}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Certificates</h2>
            {courses.length > 0
              ? <ul className="mt-2 flex flex-col gap-2">{courses.map((c) => <CertificateRow key={c.id} c={c} />)}</ul>
              : <p className="mt-2 text-[0.8125rem] text-muted-foreground">No certificates added.</p>}
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Past Folio projects {a.avgRating !== null && <span className="font-mono text-sm font-normal text-muted-foreground">· ★ {a.avgRating.toFixed(1)}</span>}
          </h2>
          {a.past.map((c) => <CredentialCard key={c.id} c={c} />)}
          {a.past.length === 0 && <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-sm text-muted-foreground">This would be their first Folio project.</div>}
        </section>
      </div>
    </div>
  );
}
