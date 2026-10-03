import Link from "next/link";
import { ago, hueFor, StatusPill } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyProjects } from "@/lib/data/startup";
import { eur, weeksLabel } from "@/lib/work";

export const metadata = { title: "My projects · Folio" };

const COLS = "grid grid-cols-[minmax(0,1fr)_120px_90px_90px_100px] gap-4";

// STARTUP INTERFACE (owner: startup builder).
export default async function CompanyProjects() {
  const user = await requireUser("/company/projects", "company");
  const projects = await getCompanyProjects(user);
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em]">My projects</h1>
        <p className="text-[15px] text-muted-foreground">Everything you&apos;ve posted on Folio.</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-sm text-muted-foreground">
          Nothing posted yet. <Link href="/company/projects/new" className="font-medium text-brand hover:underline">Post your first project</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <div className="min-w-[640px]">
            <div className={`${COLS} border-b bg-panel px-4 py-2.5 text-xs font-medium text-muted-foreground`}>
              <span>Project</span><span>Status</span><span>Pay</span><span>Duration</span><span>Applicants</span>
            </div>
            {projects.map((p) => (
              <div key={p.id} className={`${COLS} relative items-center border-b border-zinc-100 px-4 py-3.5 last:border-b-0 hover:bg-panel`}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  {/* The whole row opens the project; the applicants number below sits above this link. */}
                  <Link href={`/company/projects/${p.id}`} className="flex items-center gap-2 font-medium after:absolute after:inset-0">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: hueFor(p.category).solid }} />
                    <span className="truncate">{p.title}</span>
                  </Link>
                  <span className="text-[13px] text-muted-foreground">{p.category} · posted {ago(p.createdAt)}</span>
                </div>
                <span><StatusPill status={p.status} /></span>
                <span className="font-mono font-semibold">{eur(p.priceEur)}</span>
                <span className="text-zinc-600">{weeksLabel(p.weeks)}</span>
                <Link href={`/company/applicants?project=${p.id}`} className="relative z-10 font-mono font-medium text-brand hover:underline">{p.applicantCount}</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
