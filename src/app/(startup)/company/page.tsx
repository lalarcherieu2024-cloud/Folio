import { Clock, FolderKanban, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { initials } from "@/components/shell/Sidebar";
import { CompanyProjectCard } from "@/components/startup/CompanyProjectCard";
import { ago, avatarHue, HUES, pastLabel, type Hue } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyApplicants, getCompanyProjects, getOrganization } from "@/lib/data/startup";
import { firstName } from "@/lib/work";

export const metadata = { title: "Dashboard · Folio" };

// STARTUP INTERFACE (owner: startup builder).
export default async function CompanyDashboard() {
  const user = await requireUser("/company", "company");
  const projects = await getCompanyProjects(user);
  const [applicants, org] = await Promise.all([getCompanyApplicants(projects), getOrganization(user)]);
  const pending = applicants.filter((a) => a.status === "pending");
  const toVerify = applicants.filter((a) => a.status === "delivered" && a.projectStatus !== "verified");
  const queue = [...toVerify, ...pending];

  const stats: { label: string; value: number; href: string; icon: LucideIcon; hue: Hue }[] = [
    { label: "Open projects", value: projects.filter((p) => p.status === "open").length, href: "/company/projects", icon: FolderKanban, hue: HUES.blue },
    { label: "Applicants to review", value: pending.length, href: "/company/applicants", icon: Users, hue: HUES.coral },
    { label: "In progress", value: projects.filter((p) => p.status === "in_progress").length, href: "/company/projects", icon: Clock, hue: HUES.green },
  ];

  return (
    <div className="page-enter flex flex-col gap-8">
      <div className="flex flex-col gap-1.5 rounded-2xl bg-brand-navy px-8 py-7">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em] text-white">Welcome, {firstName(user.fullName)}</h1>
        <p className="text-[15px] text-brand-low">Post a project, pick a student, verify the work.</p>
      </div>

      {org?.status !== "verified" && (
        <Link href="/company/verify" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600 hover:border-zinc-400">
          {org?.status === "pending" ? "Folio is reviewing your company. You can post once it’s verified." : "Verify your company to start posting projects."}
          <span className="font-medium text-brand">{org?.status === "pending" ? "See status →" : "Continue verification →"}</span>
        </Link>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-px overflow-hidden rounded-xl border bg-border shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        {stats.map(({ label, value, href, icon: Icon, hue }) => (
          <Link key={label} href={href} className="flex items-center gap-3 bg-white px-5 py-3.5 transition-colors hover:bg-panel">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: hue.bg, color: hue.fg }}><Icon className="size-4" /></span>
            <span className="flex-1 text-sm text-zinc-600">{label}</span>
            <span className="text-xl font-semibold tracking-[-0.02em]">{value}</span>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Needs your review</h2>
          <Link href="/company/applicants" className="text-[13px] font-medium text-brand hover:underline">All applicants →</Link>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          {queue.length === 0 ? <p className="px-4 py-5 text-muted-foreground">You&apos;re all caught up.</p> : queue.slice(0, 5).map((a) => {
            const hue = avatarHue(a.studentId);
            return (
              <Link key={a.id} href={`/company/applicants/${a.id}`} className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 last:border-b-0 hover:bg-panel">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold" style={{ background: hue.bg, color: hue.fg }}>{initials(a.name)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-medium">{a.name}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{a.status === "delivered" ? <>Delivered {a.projectTitle} · <span className="font-medium text-brand">verify the work</span></> : <>Applied to {a.projectTitle} · {ago(a.createdAt)}</>}</span>
                </span>
                <span className="hidden text-[13px] text-muted-foreground sm:inline">{pastLabel(a.pastCount, a.avgRating)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Your projects</h2>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-sm text-muted-foreground">
            Nothing posted yet. <Link href="/company/projects/new" className="font-medium text-brand hover:underline">Post your first project</Link>
          </div>
        ) : (
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">{projects.map((p) => <CompanyProjectCard key={p.id} p={p} />)}</div>
        )}
      </section>
    </div>
  );
}
