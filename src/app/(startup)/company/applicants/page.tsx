import Link from "next/link";
import { initials } from "@/components/shell/Sidebar";
import { ApplicantActions } from "@/components/startup/ApplicantActions";
import { ago, avatarHue, pastLabel } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyApplicants, getCompanyProjects, type Applicant } from "@/lib/data/startup";
import { cn } from "@/lib/utils";

export const metadata = { title: "Applicants · Folio" };

// Waiting on you first: pending applicants, then work to verify, then everything already decided.
const order = (a: Applicant) => (a.status === "pending" ? 0 : a.status === "delivered" && a.projectStatus !== "verified" ? 1 : 2);

// STARTUP INTERFACE (owner: startup builder).
export default async function CompanyApplicants({ searchParams }: PageProps<"/company/applicants">) {
  const user = await requireUser("/company/applicants", "company");
  const { project } = await searchParams;
  const projects = await getCompanyProjects(user);
  const all = await getCompanyApplicants(projects);
  const filter = typeof project === "string" && projects.some((p) => p.id === project) ? project : "all";
  const list = all.filter((a) => filter === "all" || a.projectId === filter).sort((a, b) => order(a) - order(b));
  const toReview = list.filter((a) => order(a) < 2).length;
  const filters = [
    { id: "all", label: "All projects", count: all.length },
    ...projects.filter((p) => p.status !== "verified" && p.status !== "cancelled").map((p) => ({ id: p.id, label: p.title, count: all.filter((a) => a.projectId === p.id).length })),
  ];

  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em]">Applicants</h1>
        <p className="text-[15px] text-muted-foreground">Accepting a student declines the other applicants on that project.</p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <nav aria-label="Filter by project" className="flex max-w-[240px] flex-[1_1_200px] flex-col gap-0.5">
          <div className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Project</div>
          {filters.map((f) => (
            <Link key={f.id} href={f.id === "all" ? "/company/applicants" : `/company/applicants?project=${f.id}`} aria-current={f.id === filter ? "page" : undefined}
              className={cn("flex min-h-8 items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary", f.id === filter ? "bg-secondary font-medium text-foreground" : "text-zinc-600")}>
              <span className="leading-snug">{f.label}</span>
              <span className="font-mono text-xs text-zinc-400">{f.count}</span>
            </Link>
          ))}
        </nav>

        <section className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
          <span className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{list.length}</span> applicant{list.length === 1 ? "" : "s"} · {toReview} to review</span>
          <div className="overflow-hidden rounded-xl border bg-white">
            {list.length === 0 && <p className="px-4 py-8 text-muted-foreground">No applicants yet.</p>}
            {list.map((a) => {
              const hue = avatarHue(a.studentId);
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-3.5 border-b border-zinc-100 p-4 last:border-b-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-semibold" style={{ background: hue.bg, color: hue.fg }}>{initials(a.name)}</span>
                  <Link href={`/company/applicants/${a.id}`} className="group flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                    <span className="font-semibold group-hover:underline">{a.name}</span>
                    {a.program && <span className="text-[13px] text-muted-foreground">{a.program}</span>}
                    <span className="text-[13px] text-muted-foreground">{a.projectTitle} · {ago(a.createdAt)}</span>
                  </Link>
                  <div className="flex flex-[1_1_180px] flex-wrap gap-1.5">
                    <span className="inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium">{a.hasCv ? "CV" : "No CV"}</span>
                    <span className="inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium">{a.linkCount ? `${a.linkCount} link${a.linkCount > 1 ? "s" : ""}` : "No links"}</span>
                    <span className={cn("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium", a.pastCount ? "bg-[#f0fdf4] text-[#166534]" : "bg-secondary text-zinc-600")}>{pastLabel(a.pastCount, a.avgRating)}</span>
                  </div>
                  <ApplicantActions a={a} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
