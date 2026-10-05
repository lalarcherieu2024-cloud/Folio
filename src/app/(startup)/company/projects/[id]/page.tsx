import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProjectButton } from "@/components/shared/DeleteProjectButton";
import { BriefFilesManager } from "@/components/startup/BriefFilesManager";
import { PostedToast } from "@/components/startup/PostedToast";
import { card, StatusPill } from "@/components/startup/ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getCompanyProject } from "@/lib/data/startup";
import { getEscrow } from "@/lib/data/payments";
import { getBriefFiles } from "@/lib/data/submissions";
import { cn } from "@/lib/utils";
import { eurFromCents } from "@/lib/payments/config";
import { eur, weeksLabel } from "@/lib/work";

export const metadata = { title: "Project · Folio" };

// STARTUP INTERFACE (owner: startup builder). The project as students see it.
export default async function CompanyProjectPage(props: PageProps<"/company/projects/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const { posted } = sp;
  const user = await requireUser(`/company/projects/${id}`, "company");
  const p = await getCompanyProject(user, id);
  if (!p) notFound();
  const briefFiles = await getBriefFiles(p.id);
  const escrow = await getEscrow(p.id);
  const unpaid = p.status === "draft" && escrow?.status === "awaiting_payment";
  const stats = [["Pay", eur(p.priceEur)], ["Duration", weeksLabel(p.weeks)], ["Applicants", String(p.applicantCount)]];

  return (
    <div className="page-enter flex max-w-[53.75rem] flex-col gap-6">
      {posted && <PostedToast />}
      {unpaid && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
          <span><b className="font-semibold">Not published yet.</b> Students can&apos;t see this project until you pay. Folio holds the payment until you verify the work.</span>
          <Link href={`/company/projects/${p.id}/pay`} className={cn(buttonVariants({ size: "sm" }), "h-8 px-3 text-[0.8125rem]")}>Pay to publish</Link>
        </div>
      )}
      {sp.paid && <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3 text-sm text-[#166534]">Payment received. Your project is live for students. Folio holds the money until you verify the delivered work.</div>}
      <Link href="/company/projects" className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />My projects</Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.025em]">{p.title}</h1>
          <StatusPill status={p.status} />
          <div className="ml-auto flex flex-wrap gap-2">
            {(p.status === "draft" || p.status === "open") && (
              <DeleteProjectButton projectId={p.id} title={p.title} redirectTo="/company/projects" refund={escrow?.status === "held" ? eurFromCents(escrow.totalCents) : undefined} />
            )}
            <Link href={`/company/applicants?project=${p.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3 text-[0.8125rem]")}>
              View {p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}
            </Link>
          </div>
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-[0.9375rem] text-muted-foreground">
          <span className="font-medium text-foreground">{p.orgName ?? p.clientName}</span>
          {p.orgVerified && <Check className="size-3.5 text-[#16a34a]" strokeWidth={2.5} aria-label="Verified" />}
          <span>· {p.hood} · {p.category}</span>
        </p>
      </div>

      <p className="rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600">This is what students see when they open your project.</p>

      <article className={cn(card, "overflow-hidden")}>
        <div className="grid grid-cols-3 border-b">
          {stats.map(([k, v], i) => (
            <div key={k} className={cn("flex flex-col gap-0.5 px-5 py-4", i > 0 && "border-l")}>
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="font-mono text-[0.9375rem] font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-5 p-5">
          <p className="max-w-[68ch] text-pretty text-[0.9375rem] leading-relaxed">{p.summary}</p>
          <div>
            <h2 className="text-sm font-semibold">Deliverable{p.deliverables.length > 1 ? "s" : ""}</h2>
            <ul className="mt-2 space-y-2">
              {p.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm"><span className="mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded border bg-white"><Check className="size-3 text-zinc-400" strokeWidth={3} /></span>{d}</li>
              ))}
            </ul>
          </div>
          {p.skills.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Skills needed</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.skills.map((s) => <Badge key={s} variant="secondary" className="rounded-md px-2 text-xs font-medium text-zinc-800">{s}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </article>

      <BriefFilesManager projectId={p.id} userId={user.id} files={briefFiles} />
    </div>
  );
}
