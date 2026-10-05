import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CompanyProjectCard } from "@/components/startup/CompanyProjectCard";
import { ago, card, PageHeader, pastLabel } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getCompanyApplicants, getCompanyProjects, getOrganization } from "@/lib/data/startup";
import { cn } from "@/lib/utils";
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

  // Stat cards like the student Payments page: a thin coloured edge on top.
  const stats = [
    { label: "Open projects", value: projects.filter((p) => p.status === "open").length, href: "/company/projects", edge: "#22c55e", fg: "#166534" },
    { label: "Applicants to review", value: pending.length, href: "/company/applicants", edge: "#f59e0b", fg: "#b45309" },
    { label: "In progress", value: projects.filter((p) => p.status === "in_progress").length, href: "/company/projects", edge: "#0369a1", fg: "#0c4a6e" },
  ];

  return (
    <div className="page-enter flex flex-col gap-8">
      <PageHeader title={`Welcome, ${firstName(user.fullName)}`} sub="Post a project, pick a student, verify the work." />

      {org?.status !== "verified" && (
        <Link href="/company/verify" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600 hover:border-zinc-400">
          {org?.status === "pending" ? "Folio is reviewing your company. You can post once it’s verified." : "Verify your company to start posting projects."}
          <span className="font-medium text-foreground underline underline-offset-4">{org?.status === "pending" ? "See status" : "Continue verification"}</span>
        </Link>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={cn(card, "card-hover flex flex-col gap-1.5 p-5")} style={{ boxShadow: `inset 0 3px 0 ${s.edge}` }}>
            <span className="text-[0.8125rem] text-muted-foreground">{s.label}</span>
            <span className="font-mono text-[1.75rem] font-semibold" style={{ color: s.fg }}>{s.value}</span>
          </Link>
        ))}
      </div>

      <div className={cn(card, "flex flex-col")}>
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex flex-col gap-1"><span className="text-base font-semibold">Needs your review</span><span className="text-[0.8125rem] text-muted-foreground">New applicants and delivered work</span></div>
          <Link href="/company/applicants" className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3 text-[0.8125rem]")}>View all</Link>
        </div>
        {queue.length === 0 ? <div className="border-t border-zinc-100 px-5 py-6 text-sm text-muted-foreground">You&apos;re all caught up.</div> : queue.slice(0, 5).map((a) => (
          <Link key={a.id} href={`/company/applicants/${a.id}`} className="flex items-center gap-3.5 border-t border-zinc-100 px-5 py-3.5 hover:bg-panel">
            <UserAvatar name={a.name} color={a.avatarColor} url={a.avatarUrl} className="size-10 rounded-lg text-xs" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{a.name}</span>
              <span className="truncate text-[0.8125rem] text-muted-foreground">{a.status === "delivered" ? `Delivered ${a.projectTitle}` : `Applied to ${a.projectTitle} · ${ago(a.createdAt)}`}</span>
            </span>
            {a.status === "delivered"
              ? <span className="inline-flex h-[1.375rem] shrink-0 items-center rounded-md bg-[#ede9fe] px-2 text-xs font-medium text-[#5b21b6]">Verify the work</span>
              : <span className="hidden shrink-0 text-[0.8125rem] text-muted-foreground sm:inline">{pastLabel(a.pastCount, a.avgRating)}</span>}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Your projects</h2>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-sm text-muted-foreground">
            Nothing posted yet. <Link href="/company/projects/new" className="font-medium text-foreground underline underline-offset-4">Post your first project</Link>
          </div>
        ) : (
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{projects.map((p) => <CompanyProjectCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
