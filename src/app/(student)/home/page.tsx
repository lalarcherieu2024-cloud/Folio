import Link from "next/link";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { StrengthsCard } from "@/components/student/StrengthsCard";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getApplications, getRecommended, getSavedIds } from "@/lib/data/student";
import { cn } from "@/lib/utils";
import { TONE_CLASS, dueInfo, eur, firstName, interviewWhen, nextLabel, profileChecklist, stageColors, stagePct, statusInfo, viewerFrom } from "@/lib/work";
import { BriefcaseBusiness, Check, FileUser, GraduationCap } from "lucide-react";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

// PayPal's double-P monogram, simplified: a light-blue P behind a white one, for the payout step.
const PayPalMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-3">
    <path fillRule="evenodd" fill="#009cde" d="M10.5 6h6.2a4.3 4.3 0 0 1 0 8.6h-3.6L12.1 21H8.7zM13.4 8.8l-.6 3.4h3.3a1.7 1.7 0 0 0 0-3.4z" />
    <path fillRule="evenodd" fill="#fff" d="M7 2h6.2a4.3 4.3 0 0 1 0 8.6H9.6L8.6 17H5.2zM9.9 4.8l-.6 3.4h3.3a1.7 1.7 0 0 0 0-3.4z" />
  </svg>
);

// Each unfinished profile step in its own colour (finished ones turn green). LinkedIn keeps its brand blue.
const CHECKLIST_TONES: Record<string, { solid: string; text: string; bg: string; border: string; pill: string; ring: string }> = {
  linkedin: { solid: "#0a66c2", text: "#004182", bg: "#eaf3fc", border: "#0a66c2", pill: "#d4e6f9", ring: "rgba(10,102,194,.12)" },
  payout: { solid: "#d97706", text: "#92400e", bg: "#fffbeb", border: "#fde68a", pill: "#fef3c7", ring: "rgba(217,119,6,.12)" },
  courses: { solid: "#e11d48", text: "#9f1239", bg: "#fff1f2", border: "#fecdd3", pill: "#ffe4e6", ring: "rgba(225,29,72,.12)" },
  portfolio: { solid: "#7c3aed", text: "#5b21b6", bg: "#f5f3ff", border: "#ddd6fe", pill: "#ede9fe", ring: "rgba(124,58,237,.12)" },
  cv: { solid: "#0891b2", text: "#155e75", bg: "#ecfeff", border: "#a5f3fc", pill: "#cffafe", ring: "rgba(8,145,178,.12)" },
};

export default async function StudentHome() {
  const user = await requireUser("/home", "student");
  const [apps, savedIds] = await Promise.all([getApplications(user), getSavedIds(user)]);
  const viewer = viewerFrom(user, savedIds);
  const { projects: recommended, basedOn } = await getRecommended(user, apps as never);
  const { items, required, pct } = profileChecklist(user);
  // "In progress" is only what is still moving: finished (verified) and declined applications drop out of it.
  const stageOf = (a: (typeof apps)[number]) => statusInfo(a, a.project).stage;
  const active = apps.filter((a) => stageOf(a) !== "verified" && stageOf(a) !== "declined");
  const inMotion = active.length;
  const left = required.filter((i) => !i.done).length;
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
        <div className={cn(card, "grid gap-6 p-6 md:grid-cols-[1fr_1.2fr] md:gap-10")}>
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
            {items.map((c) => {
              if (c.done) return (
                <span key={c.key} className="flex items-center gap-2.5 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5 text-sm text-[#166534]">
                  <span className="grid size-[1.125rem] shrink-0 place-items-center rounded-full border border-[#16a34a] bg-[#16a34a]"><Check className="size-2.5 text-white" strokeWidth={3.5} /></span>
                  <span className="flex-1">{c.label}</span>
                  <span className="inline-flex h-5 items-center rounded-full bg-[#dcfce7] px-2 text-[0.6875rem] font-medium text-[#166534]">Done</span>
                </span>
              );
              const t = CHECKLIST_TONES[c.key];
              const priority = "priority" in c && c.priority;
              return (
                <Link key={c.key} href={"href" in c && c.href ? c.href : "/profile"}
                  className={cn("flex items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors hover:brightness-[.98]", priority ? "py-3 font-medium" : "py-2.5")}
                  style={{ borderColor: t.border, background: t.bg, color: t.text, boxShadow: priority ? `0 0 0 3px ${t.ring}` : undefined }}>
                  {/* Each step's own mark, white on its colour: LinkedIn's "in", PayPal's logo, courses, a portfolio and a CV. */}
                  {/* PayPal's mark keeps PayPal's blue, like LinkedIn's does; the row itself stays amber. */}
                  <span className="grid size-[1.125rem] shrink-0 place-items-center rounded-[0.25rem] text-white" style={{ background: c.key === "payout" ? "#003087" : t.solid }}>
                    {c.key === "linkedin" ? <span className="text-[0.625rem] font-bold leading-none">in</span>
                      : c.key === "payout" ? <PayPalMark />
                      : c.key === "courses" ? <GraduationCap className="size-3" strokeWidth={2.4} />
                      : c.key === "portfolio" ? <BriefcaseBusiness className="size-3" strokeWidth={2.4} />
                      : <FileUser className="size-3" strokeWidth={2.4} />}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  <span className="inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] font-medium" style={priority ? { background: t.solid, color: "#fff" } : { background: t.pill, color: t.text }}>{"optional" in c && c.optional ? "Optional" : "Pending"}</span>
                </Link>
              );
            })}
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

