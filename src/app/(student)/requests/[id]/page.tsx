import { ArrowLeft, Check, Lock, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProjectButton } from "@/components/shared/DeleteProjectButton";
import { RequestApplicants } from "@/components/student/RequestApplicants";
import { SavedToast } from "@/components/student/SavedToast";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getApplicants, getOwnedProject } from "@/lib/data/applicants";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";

export const metadata = { title: "Request · Folio" };

const STATUS = {
  draft: ["Not published yet", "bg-[#fef3c7] text-[#92400e]"],
  open: ["Open · accepting applications", "bg-[#dcfce7] text-[#166534]"],
  in_progress: ["In progress", "bg-[#e0f2fe] text-[#0c4a6e]"],
  delivered: ["Delivered", "bg-[#ede9fe] text-[#5b21b6]"],
  verified: ["Verified", "bg-[#dcfce7] text-[#166534]"],
  cancelled: ["Cancelled", "bg-zinc-100 text-zinc-600"],
} as const;

export default async function RequestPage(props: PageProps<"/requests/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/requests/${id}`, "student");
  const project = await getOwnedProject(user, id);
  if (!project) notFound();
  const applicants = await getApplicants(project);
  const [label, tone] = STATUS[project.status];
  const sp = await props.searchParams;
  const saved = typeof sp.saved === "string" ? Number(sp.saved) : null;
  const working = applicants.find((a) => a.status === "accepted");
  const canEdit = project.status === "open";
  const card = "rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]";

  return (
    <div className="page-enter flex flex-col gap-6">
      <Link href="/applications?tab=requests" className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />My work · Posted by me</Link>

      {saved !== null && Number.isFinite(saved) && <SavedToast notified={saved} />}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.025em]">{project.title}</h1>
          <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", tone)}>{label}</span>
          {canEdit ? (
            <div className="ml-auto flex flex-wrap gap-2">
              <DeleteProjectButton projectId={project.id} title={project.title} redirectTo="/applications?tab=requests" noun="request" />
              <Link href={`/requests/${project.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5 bg-white px-3 text-[0.8125rem]")}><Pencil className="size-3.5" />Edit request</Link>
            </div>
          ) : (
            <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-100 px-3 text-[0.8125rem] text-zinc-600"><Lock className="size-3.5" />Locked: someone is working on this</span>
          )}
        </div>
        <p className="text-[0.9375rem] text-muted-foreground">{project.category} · <span className="font-mono">{eur(project.priceEur)}</span> · {weeksLabel(project.weeks)}</p>
      </div>

      {working && (
        <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-4 text-sm text-[#166534]">
          <b className="font-semibold">{working.student.fullName}</b> is working on this. It no longer appears in Find projects.
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Applicants <span className="font-mono text-sm font-normal text-muted-foreground">{applicants.length}</span></h2>
          <RequestApplicants applicants={applicants} project={project} />
        </section>

        <aside className="flex flex-col gap-4">
          <div className={card}>
            <h2 className="text-sm font-semibold">What you asked for</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed">{project.summary}</p>
            <h3 className="mt-5 text-sm font-semibold">Deliverables</h3>
            <ul className="mt-2 space-y-2">
              {project.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm"><span className="mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded border bg-white"><Check className="size-3 text-zinc-400" strokeWidth={3} /></span>{d}</li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg border bg-panel p-3.5">
              <h3 className="text-sm font-semibold">Done when</h3>
              <p className="mt-1 text-sm text-muted-foreground">{project.doneWhen}</p>
            </div>
            <h3 className="mt-5 text-sm font-semibold">Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="rounded-md px-2 text-xs font-medium">{project.category}</Badge>
              {project.skills.map((s) => <Badge key={s} variant="secondary" className="rounded-md px-2 text-xs font-medium text-zinc-800">{s}</Badge>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
