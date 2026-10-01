import Link from "next/link";
import { Landing } from "@/components/Landing";
import { ProjectCard } from "@/components/ProjectCard";
import { StrengthsCard } from "@/components/StrengthsCard";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getApplications, getCategoryCounts, getCredentials, getOpenProjects, getRecommended } from "@/lib/data";
import { cn } from "@/lib/utils";
import { STEPS, TONE_CLASS, eur, firstName, profileChecklist, statusInfo } from "@/lib/work";
import { Check } from "lucide-react";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

export default async function Home() {
  const user = await getSession();
  if (!user) {
    const [projects, counts] = await Promise.all([getOpenProjects(), getCategoryCounts()]);
    return <Landing projects={projects} counts={counts} />;
  }

  const [apps, creds, open] = await Promise.all([getApplications(user), getCredentials(user), getOpenProjects()]);
  const { projects: recommended, basedOn } = await getRecommended(user, apps as never);
  const { items, pct } = profileChecklist(user, apps.length, creds.length);
  const inMotion = apps.filter((a) => a.status !== "declined").length;
  const left = items.filter((i) => !i.done).length;
  const card = "rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

  return (
    <div className="page-enter flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-semibold tracking-[-0.025em]">{greeting()}, {firstName(user.fullName)}</h1>
          <p className="text-[15px] text-muted-foreground">{inMotion} project{inMotion === 1 ? "" : "s"} in motion. {left === 0 ? "Your profile is complete." : `${left} step${left === 1 ? "" : "s"} left on your profile.`}</p>
        </div>
        <Link href="/projects" className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3.5 shadow-xs")}>Browse all {open.length} projects</Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-4">
        <div className={cn(card, "flex flex-col")}>
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <div className="flex flex-col gap-1"><span className="text-base font-semibold">Your pipeline</span><span className="text-[13px] text-muted-foreground">From application to verified credential</span></div>
            <Link href="/applications" className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3 text-[13px]")}>View all</Link>
          </div>
          {apps.length === 0 ? (
            <div className="border-t border-zinc-100 px-5 py-6 text-sm text-muted-foreground">No applications yet. <Link href="/projects" className="font-medium text-foreground underline underline-offset-4">Find your first project</Link>.</div>
          ) : apps.slice(0, 4).map((a) => {
            const s = statusInfo(a, a.project);
            return (
              <Link key={a.id} href={`/projects?project=${a.projectId}`} className="flex flex-col gap-2.5 border-t border-zinc-100 px-5 py-3.5 hover:bg-panel">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5"><span className="truncate text-sm font-medium">{a.project.title}</span><span className="text-[13px] text-muted-foreground">{a.project.orgName ?? a.project.clientName} · {eur(a.project.priceEur)}</span></div>
                  <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-md px-2 text-xs font-medium", TONE_CLASS[s.tone])}>{s.label}</span>
                </div>
                <div className="flex gap-1">{STEPS.map((_, i) => <div key={i} className="h-1 flex-1 rounded-sm" style={{ background: i <= s.step ? "#18181b" : "#e4e4e7" }} />)}</div>
              </Link>
            );
          })}
        </div>

        <div className={cn(card, "flex flex-col gap-4 p-5")}>
          <div className="flex flex-col gap-1"><span className="text-base font-semibold">Profile strength</span><span className="text-[13px] text-muted-foreground">Clients see this before they accept you</span></div>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
            <span className="font-mono text-[13px] font-medium">{pct}%</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {items.map((c) => (
              <div key={c.label} className={cn("flex items-center gap-2.5 text-sm", c.done ? "text-foreground" : "text-muted-foreground")}>
                <span className={cn("grid size-[18px] place-items-center rounded-full border", c.done ? "border-[#16a34a] bg-[#16a34a]" : "border-zinc-300 bg-white")}>{c.done && <Check className="size-2.5 text-white" strokeWidth={3.5} />}</span>
                {c.label}
              </div>
            ))}
          </div>
          {!user.cv && <Link href="/profile" className={cn(buttonVariants({ variant: "outline" }), "h-9 justify-start bg-white px-3.5")}>Upload your CV</Link>}
        </div>
      </div>

      <StrengthsCard strengths={user.strengths} hasCv={!!user.cv} />

      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recommended for you</h2>
          <span className="text-[13px] text-muted-foreground">{basedOn.length ? <>Matched on {basedOn.join(", ")}</> : "Newest projects"}</span>
        </div>
        <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">{recommended.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      </div>
    </div>
  );
}

