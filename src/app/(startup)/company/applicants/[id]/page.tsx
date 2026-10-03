import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CredentialCard } from "@/components/shared/CredentialCard";
import { initials } from "@/components/shell/Sidebar";
import { ApplicantActions } from "@/components/startup/ApplicantActions";
import { ago, avatarHue } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getApplicant } from "@/lib/data/startup";

export const metadata = { title: "Applicant · Folio" };

const card = "flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]";

// STARTUP INTERFACE (owner: startup builder).
export default async function ApplicantProfile(props: PageProps<"/company/applicants/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/company/applicants/${id}`, "company");
  const a = await getApplicant(user, id);
  if (!a) notFound();
  const hue = avatarHue(a.studentId);

  return (
    <div className="page-enter flex max-w-[960px] flex-col gap-6">
      <Link href={`/company/applicants?project=${a.projectId}`} className="text-[13px] text-muted-foreground hover:text-foreground">← Applicants</Link>
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-xl text-lg font-semibold" style={{ background: hue.bg, color: hue.fg }}>{initials(a.name)}</span>
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{a.name}</h1>
          <span className="text-sm text-muted-foreground">
            {a.program}{a.program && a.uniEmailVerified && " · "}
            {a.uniEmailVerified && <span className="text-[#166534]">✓ IE email verified</span>}
          </span>
        </div>
        <ApplicantActions a={a} size="lg" />
      </div>

      <Link href={`/company/projects/${a.projectId}`} className="flex items-center gap-2 rounded-[10px] border bg-panel px-4 py-3 text-[13px] text-zinc-600 hover:border-zinc-400">
        <span>Applied to</span><span className="font-medium text-foreground">{a.projectTitle}</span><span>· {ago(a.createdAt)}</span>
      </Link>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-start gap-4">
        <div className="flex flex-col gap-4">
          <div className={card}>
            <span className="text-base font-semibold">Their pitch</span>
            {a.pitch ? <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-zinc-700">{a.pitch}</p> : <p className="text-[13px] text-muted-foreground">They applied without a note.</p>}
          </div>
          <div className={card}>
            <span className="text-base font-semibold">CV</span>
            {a.cv ? (
              <div className="flex items-center gap-3 rounded-lg border bg-panel p-3">
                <span className="grid size-10 place-items-center rounded-md bg-white text-[11px] font-semibold ring-1 ring-border">{a.cv.fileName.split(".").pop()?.toUpperCase().slice(0, 4) ?? "CV"}</span>
                <div className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-medium">{a.cv.fileName}</span><span className="text-xs text-muted-foreground">{a.cv.sizeKb} KB</span></div>
                <a href={`/company/applicants/${a.id}/cv`} target="_blank" rel="noopener noreferrer" className="grid h-8 place-items-center rounded-md border bg-white px-3 text-[13px] font-medium hover:bg-muted">Open</a>
              </div>
            ) : <span className="text-[13px] text-muted-foreground">No CV uploaded.</span>}
            <span className="text-base font-semibold">Portfolio links</span>
            <div className="flex flex-col gap-2">
              {a.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-between rounded-lg border px-3 text-sm text-brand hover:bg-panel">
                  <span className="truncate">{l.label}</span><ArrowUpRight className="size-4 shrink-0 text-zinc-400" />
                </a>
              ))}
              {a.links.length === 0 && <span className="text-[13px] text-muted-foreground">No links added.</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-base font-semibold">Past Folio projects</span>
            {a.avgRating !== null && <span className="text-[13px] text-muted-foreground">Average ★ {a.avgRating.toFixed(1)}</span>}
          </div>
          {a.past.map((c) => <CredentialCard key={c.id} c={c} />)}
          {a.past.length === 0 && <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-muted-foreground">This would be their first Folio project.</div>}
          {a.past.length > 0 && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 text-[#16a34a]" />Each one was verified by the client who paid for it.</p>}
        </div>
      </div>
    </div>
  );
}
