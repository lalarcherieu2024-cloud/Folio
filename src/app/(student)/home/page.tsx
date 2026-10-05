import Link from "next/link";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { StrengthsCard } from "@/components/student/StrengthsCard";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getApplications, getRecommended, getSavedIds } from "@/lib/data/student";
import { cn } from "@/lib/utils";
import { TONE_CLASS, dueInfo, eur, firstName, interviewWhen, nextLabel, profileChecklist, stageColors, stagePct, statusInfo, viewerFrom } from "@/lib/work";
import { Check } from "lucide-react";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

export default async function StudentHome() {
  const user = await requireUser("/home", "student");
  const [apps, savedIds] = await Promise.all([getApplications(user), getSavedIds(user)]);
  const viewer = viewerFrom(user, savedIds);
  const { projects: recommended, basedOn } = await getRecommended(user, apps as never);
  const { items, pct } = profileChecklist(user);
  // "In progress" is only what is still moving: finished (verified) and declined applications drop out of it.
  const stageOf = (a: (typeof apps)[number]) => statusInfo(a, a.project).stage;
  const active = apps.filter((a) => stageOf(a) !== "verified" && stageOf(a) !== "declined");
  const inMotion = active.length;
  const left = items.filter((i) => !i.done).length;
  const card = "rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]";

  return (
    <div className="page-enter flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">{greeting()}, {firstName(user.fullName)}</h1>
          <p className="text-[0.9375rem] text-muted-foreground">{inMotion} project{inMotion === 1 ? "" : "s"} in motion. {left === 0 ? "Your profile is complete." : `${left} step${left === 1 ? "" : "s"} left on your profile.`}</p>
        </div>
      </div>

      {/* An unfinished profile is the first thing to fix: clients see it before they accept you. */}
      {pct < 100 && (
        <div className={cn(card, "grid gap-6 border-[#fdba74] p-6 md:grid-cols-[1fr_1.2fr] md:gap-10")} style={{ boxShadow: "inset 4px 0 0 #f97316" }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-[#c2410c]">Start here</span>
              <h2 className="text-xl font-semibold tracking-tight">Complete your profile</h2>
              <p className="text-sm text-muted-foreground">Clients see this before they accept you. {left} step{left === 1 ? "" : "s"} to go.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded transition-[width] duration-500" style={{ width: `${pct}%`, background: "#f97316" }} /></div>
              <span className="font-mono text-[0.8125rem] font-medium">{pct}%</span>
            </div>
            <Link href="/profile" className={cn(buttonVariants(), "mt-auto h-9 w-fit px-4")}>Finish your profile</Link>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((c) => (
              <Link key={c.label} href="/profile" className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm", c.done ? "pointer-events-none border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]" : "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412] hover:border-[#fb923c]")}>
                <span className={cn("grid size-[1.125rem] shrink-0 place-items-center rounded-full border", c.done ? "border-[#16a34a] bg-[#16a34a]" : "border-[#fb923c] bg-white")}>
                  {c.done ? <Check className="size-2.5 text-white" strokeWidth={3.5} /> : <span className="size-1.5 rounded-full bg-[#f97316]" />}
                </span>
                <span className="flex-1">{c.label}</span>
                <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] font-medium", c.done ? "bg-[#dcfce7] text-[#166534]" : "bg-[#ffedd5] text-[#c2410c]")}>{c.done ? "Done" : "Pending"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22.5rem),1fr))] gap-4">
        <div className={cn(card, "flex flex-col")}>
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <div className="flex flex-col gap-1"><span className="text-base font-semibold">In progress</span><span className="text-[0.8125rem] text-muted-foreground">Track each project from pitch to payout</span></div>
            <Link href="/applications" className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3 text-[0.8125rem]")}>View all</Link>
          </div>
          {active.length === 0 ? (
            apps.length > 0 ? (
              <div className="border-t border-zinc-100 px-5 py-6 text-sm text-muted-foreground">Nothing in progress right now. <Link href="/projects" className="font-medium text-foreground underline underline-offset-4">Find your next project</Link>.</div>
            ) : (
            <div className="border-t border-zinc-100 px-5 py-6 text-sm text-muted-foreground">No applications yet. Your first one is usually the hardest: pick a project that matches your skills and send a short note. <Link href="/projects" className="font-medium text-foreground underline underline-offset-4">Find your first project</Link>.</div>
            )
          ) : active.slice(0, 4).map((a) => {
            const s = statusInfo(a, a.project);
            const [ring, fg, tint] = stageColors(s.stage);
            const pctN = stagePct(s);
            return (
              <Link key={a.id} href={s.stage === "applied" || s.stage === "declined" ? `/projects/${a.projectId}` : `/applications/${a.id}`} className="flex items-center gap-3.5 border-t border-zinc-100 px-5 py-3.5 hover:bg-panel" style={{ boxShadow: `inset 3px 0 0 ${ring}`, background: tint }}>
                <div title={`Step ${s.step + 1} of ${s.steps.length}: ${s.steps[s.step]}`} className="grid size-[3.25rem] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${ring} ${pctN}%, #eef4f8 0)` }}>
                  <div className="grid size-[2.625rem] place-items-center rounded-full bg-white font-mono text-xs font-semibold" style={{ color: fg }}>{pctN}%</div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium">{a.project.title}</span>
                  <span className="text-[0.8125rem] text-muted-foreground">{a.project.orgName ?? a.project.clientName} · {eur(a.project.priceEur)}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: fg }}><span className="size-1.5 rounded-full" style={{ background: ring }} />{s.stage === "building" ? (dueInfo(a.acceptedAt, a.project.weeks)?.label ?? nextLabel(s)) : s.stage === "interview" && a.interview ? `Interview ${interviewWhen(a.interview.at)}` : nextLabel(s)}</span>
                </div>
                <span className={cn("inline-flex h-[1.375rem] shrink-0 items-center rounded-md px-2 text-xs font-medium", TONE_CLASS[s.tone])}>{s.label}</span>
              </Link>
            );
          })}
        </div>

      </div>


      <StrengthsCard strengths={user.strengths} hasCv={!!user.cv} cvIsPdf={!!user.cv && /\.pdf$/i.test(user.cv.fileName)} />

      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recommended for you</h2>
          <span className="text-[0.8125rem] text-muted-foreground">{basedOn.length ? <>Matched on {basedOn.join(", ")}</> : "Newest projects"}</span>
        </div>
        <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{recommended.map((p) => <ProjectCard key={p.id} p={p} viewer={viewer} />)}</div>
      </div>
    </div>
  );
}

