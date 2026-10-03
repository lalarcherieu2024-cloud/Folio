import Link from "next/link";
import { ago, card, PageHeader, StatusPill } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyProjects } from "@/lib/data/startup";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";

export const metadata = { title: "My projects · Folio" };

const COLS = "grid grid-cols-[minmax(0,1fr)_7.5rem_5.625rem_5.625rem_6.25rem] gap-4";

// STARTUP INTERFACE (owner: startup builder).
export default async function CompanyProjects() {
  const user = await requireUser("/company/projects", "company");
  const projects = await getCompanyProjects(user);
  return (
    <div className="page-enter flex flex-col gap-6">
      <PageHeader title="My projects" sub="Everything you’ve posted on Folio, with status and applicants." />

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-sm text-muted-foreground">
          Nothing posted yet. <Link href="/company/projects/new" className="font-medium text-foreground underline underline-offset-4">Post your first project</Link>
        </div>
      ) : (
        <div className={cn(card, "overflow-x-auto")}>
          <div className="min-w-[40rem]">
            <div className={`${COLS} border-b bg-panel px-5 py-2.5 text-xs font-medium text-muted-foreground`}>
              <span>Project</span><span>Status</span><span>Pay</span><span>Duration</span><span>Applicants</span>
            </div>
            {projects.map((p) => (
              <div key={p.id} className={`${COLS} relative items-center border-b border-zinc-100 px-5 py-3.5 last:border-b-0 hover:bg-panel`}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  {/* The whole row opens the project; the applicants number below sits above this link. */}
                  <Link href={`/company/projects/${p.id}`} className="truncate text-sm font-medium after:absolute after:inset-0">{p.title}</Link>
                  <span className="text-[0.8125rem] text-muted-foreground">{p.category} · posted {ago(p.createdAt)}</span>
                </div>
                <span><StatusPill status={p.status} /></span>
                <span className="font-mono text-sm font-semibold">{eur(p.priceEur)}</span>
                <span className="text-sm text-zinc-600">{weeksLabel(p.weeks)}</span>
                <Link href={`/company/applicants?project=${p.id}`} className="relative z-10 font-mono text-sm font-medium underline underline-offset-4 hover:text-primary">{p.applicantCount}</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
