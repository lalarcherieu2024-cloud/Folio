import { Building2 } from "lucide-react";
import Link from "next/link";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getCompanyProjects } from "@/lib/data/startup";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard · Folio" };

// STARTUP INTERFACE (owner: startup builder). Placeholder dashboard: replace freely.
export default async function CompanyDashboard() {
  const user = await requireUser("/company", "company");
  const projects = await getCompanyProjects(user);
  return (
    <div className="page-enter flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Welcome, {user.fullName.split(" ")[0]}</h1>
          <p className="text-[0.9375rem] text-muted-foreground">Post a project, pick a student, verify the work.</p>
        </div>
        <Link href="/company/projects/new" className={cn(buttonVariants(), "h-9 px-3.5")}>Post a project</Link>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-dashed border-zinc-300 p-5">
        <Building2 className="mt-0.5 size-5 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">The company side is being built.</p>
          <p className="mt-1 text-muted-foreground">See the TODO list at the bottom of <code>src/lib/data/startup.ts</code> for the plan: applicants, accepting a student, verifying delivery, company verification, payments.</p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Your projects</h2>
        {projects.length === 0 ? <p className="text-sm text-muted-foreground">Nothing posted yet.</p> : (
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{projects.map((p) => <ProjectCard key={p.id} p={p} href={`/company/projects?project=${p.id}`} />)}</div>
        )}
      </section>
    </div>
  );
}
