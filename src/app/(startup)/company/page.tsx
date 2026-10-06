import { ArrowRight, Check, Circle } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { FirstRunTour } from "@/components/startup/FirstRunTour";
import { ago, card, CategoryChip, pastLabel } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { boardRows, COMPANY_STEPS, nextStep, toneClass, type BoardRow } from "@/lib/company-work";
import { getCompanyLedger } from "@/lib/data/payments";
import { getCompanyApplicants, getCompanyProjects, getOrganization, type Organization } from "@/lib/data/startup";
import { eurFromCents } from "@/lib/payments/config";
import type { StudentProfile } from "@/lib/types";
import { detailsComplete } from "@/lib/org";
import { cn } from "@/lib/utils";
import { eur, firstName } from "@/lib/work";

export const metadata = { title: "Home · Folio" };

// "Tuesday 6 October", in Madrid time like the greeting.
const today = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" }).format(new Date());

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

// What makes students trust a company, in the order it's usually done (the student side has "Complete your profile").
function setupSteps(user: StudentProfile, org: Organization | null, rows: BoardRow[]) {
  return [
    { label: "Company details", done: !!org?.about && !!org?.website, href: org ? "/company/profile" : "/company/verify" },
    { label: "Verification by Folio", done: org?.status === "verified", href: "/company/verify" },
    { label: "Company logo", done: !!org?.logoUrl, href: "/company/profile" },
    { label: "LinkedIn connected", done: user.linkedinVerified, href: "/company/profile" },
    { label: "First project published", done: rows.some((r) => r.stage.key !== "draft" && r.stage.key !== "cancelled"), href: "/company/projects/new" },
  ];
}

// Where a pipeline row opens: the step that needs the company.
function rowHref(r: BoardRow) {
  if (r.stage.key === "draft") return `/company/projects/${r.project.id}/pay`;
  if ((r.stage.key === "building" || r.stage.key === "submitted") && r.hired) return `/company/applicants/${r.hired.id}`;
  if (r.stage.key === "open" && r.waiting) return `/company/applicants?project=${r.project.id}`;
  return `/company/projects/${r.project.id}`;
}

// Most urgent first: work to review, applicants waiting, work in progress, then unpaid drafts.
const URGENCY = { submitted: 0, open: 1, building: 2, draft: 3, verified: 4, cancelled: 5 } as const;
const th = "px-5 py-2.5 text-left text-xs font-medium text-muted-foreground";

// STARTUP INTERFACE. The company home: the student home's content, presented as a calm dashboard.
export default async function CompanyHome() {
  const user = await requireUser("/company", "company");
  const projects = await getCompanyProjects(user);
  const [applicants, org, ledger] = await Promise.all([getCompanyApplicants(projects), getOrganization(user), getCompanyLedger(user)]);
  const rows = boardRows(projects, applicants);
  const active = rows.filter((r) => r.stage.key !== "verified" && r.stage.key !== "cancelled")
    .sort((a, b) => URGENCY[a.stage.key] - URGENCY[b.stage.key] || b.waiting - a.waiting);
  const pending = applicants.filter((a) => a.status === "pending" || a.status === "interview");
  const toVerify = applicants.filter((a) => a.status === "delivered" && a.projectStatus !== "verified");
  const queue = [...toVerify, ...pending];
  const steps = setupSteps(user, org, rows);
  const done = steps.filter((s) => s.done).length;
  // Verification steps done (details, then submitted with LinkedIn), for the card's progress. Documents come later,
  // on the payment page.
  const verifyDone = org?.status === "pending" ? 2 : detailsComplete(org) ? 1 : 0;
  const tourStage = org?.status !== "verified" ? (org?.status === "pending" ? null : "verify")
    : rows.every((r) => r.stage.key === "draft" || r.stage.key === "cancelled") ? "post"
    : pending.length > 0 ? "applicants" : null;

  const kpis = [
    { label: "Live projects", value: String(rows.filter((r) => r.stage.key === "open").length), href: "/company/projects" },
    { label: "Ready for your review", value: String(queue.length), href: "/company/applicants", alert: queue.length > 0 },
    { label: "In progress", value: String(rows.filter((r) => r.stage.key === "building" || r.stage.key === "submitted").length), href: "/company/projects" },
    { label: "Held in escrow", value: eurFromCents(ledger.heldCents), href: "/company/payments" },
  ];

  return (
    <div className="page-enter flex flex-col gap-7">
      {/* The greeting as a small masthead: today's date, the company (logo, name, verification), and what needs
          attention (the figures are in the strip below). The topbar already has "Post a project", so no button here. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <UserAvatar name={org?.name || user.fullName} color={org?.logoColor} url={org?.logoUrl} className="size-14 shrink-0 rounded-2xl text-lg ring-1 ring-black/5" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{today()}</span>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">{greeting()}, {firstName(user.fullName)}</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] text-muted-foreground">
            {org?.name && <span className="font-medium text-zinc-700">{org.name}</span>}
            {org?.name && <span aria-hidden>·</span>}
            {org?.status === "verified"
              ? <span className="inline-flex items-center gap-1 font-medium text-[#15803d]"><Check className="size-3.5" strokeWidth={3} />Verified</span>
              : org?.status === "pending" ? <span>Verification in review</span>
              : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef2f2] px-2.5 py-0.5 text-[0.8125rem] font-medium text-[#b91c1c]"><span className="size-1.5 rounded-full bg-[#ef4444]" />Not verified yet</span>}
            {queue.length > 0 && <><span aria-hidden>·</span><span>{queue.length} thing{queue.length === 1 ? " needs" : "s need"} you</span></>}
          </p>
        </div>
      </div>

      {/* One coaching tip for the step the company is on: verify, then post a first project, then review applicants. */}
      {tourStage && <FirstRunTour userId={user.id} stage={tourStage} />}

      {/* Until the company is verified nothing else on this page matters much, so this leads the page and stays
          highlighted until it's done: a brand ring that gently pulses (verify-highlight), a "Next step" tag and how
          far along they are. By size and emphasis, not a warning colour. */}
      {org?.status !== "verified" && (
        <div data-tour="verify" className={cn(card, "verify-highlight flex flex-wrap items-center gap-x-8 gap-y-4 border-brand/40 p-6 md:p-7")}>
          <div className="flex min-w-[16rem] flex-1 flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium text-brand">
              <span className="size-1.5 rounded-full bg-brand" />{org?.status === "pending" ? "In review" : "Next step"}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">{org?.status === "pending" ? "Folio is reviewing your company" : "Verify your company to start publishing"}</h2>
            <p className="max-w-[60ch] text-[0.9375rem] text-muted-foreground">
              {org?.status === "pending"
                ? "We check every company before students see its projects, usually within 1–2 business days. You can publish as soon as it's verified."
                : "Students only see projects from verified companies. It takes about 2 minutes: your company details and your LinkedIn. No documents needed yet."}
            </p>
            <div className="mt-1 flex max-w-[22rem] items-center gap-3">
              <div className="flex flex-1 gap-1">{[0, 1].map((n) => <span key={n} className={cn("h-1.5 flex-1 rounded-full", n < verifyDone ? "bg-brand" : "bg-zinc-200")} />)}</div>
              <span className="text-xs tabular-nums text-muted-foreground">{verifyDone} of 2 done</span>
            </div>
          </div>
          <Link href="/company/verify" className={cn(buttonVariants(), "h-11 shrink-0 gap-2 px-5 text-[0.9375rem]")}>
            {org?.status === "pending" ? "See status" : verifyDone ? "Continue verification" : "Start verification"}<ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* Key figures in one strip, like a dashboard. */}
      <div className={cn(card, "grid grid-cols-2 divide-zinc-100 md:grid-cols-4 md:divide-x")}>
        {kpis.map((k, i) => (
          <Link key={k.label} href={k.href} className={cn("flex flex-col gap-1 px-5 py-4 hover:bg-panel", i < 2 && "border-b border-zinc-100 md:border-b-0", i % 2 === 0 && "border-r border-zinc-100 md:border-r-0")}>
            <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
            <span className={cn("font-mono text-2xl font-semibold tracking-tight", k.alert && "text-[#92400e]")}>{k.value}</span>
          </Link>
        ))}
      </div>

      {done < steps.length && (
        <div className={cn(card, "flex flex-col gap-4 p-5")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-semibold">Complete your company profile</h2>
              <span className="text-[0.8125rem] text-muted-foreground">A complete profile attracts stronger applicants. {done} of {steps.length} done.</span>
            </div>
            <Link href={steps.find((s) => !s.done)?.href ?? "/company/profile"} className={cn(buttonVariants(), "h-9 gap-1.5 px-3.5")}>Continue setup<ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-primary" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className={cn("flex items-center gap-2 text-[0.8125rem]", s.done ? "pointer-events-none text-muted-foreground" : "font-medium text-foreground hover:underline")}>
                  {s.done ? <Check className="size-3.5 shrink-0 text-[#15803d]" strokeWidth={2.5} /> : <Circle className="size-3.5 shrink-0 text-zinc-300" />}{s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className={cn(card, "flex flex-col")}>
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="flex flex-col gap-0.5"><h2 className="text-base font-semibold">Ready for you</h2><span className="text-[0.8125rem] text-muted-foreground">Students are waiting to hear from you. A quick reply keeps things moving.</span></div>
          <Link href="/company/applicants" className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground">View all</Link>
        </div>
        {queue.length === 0 ? <div className="border-t border-zinc-100 px-5 py-5 text-sm text-muted-foreground">You&apos;re all caught up. Nice work.</div> : queue.slice(0, 5).map((a) => (
          <Link key={a.id} href={`/company/applicants/${a.id}`} className="flex items-center gap-3.5 border-t border-zinc-100 px-5 py-3 hover:bg-panel">
            <UserAvatar name={a.name} color={a.avatarColor} url={a.avatarUrl} className="size-8 rounded-md text-[0.6875rem]" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{a.name}</span>
              <span className="truncate text-[0.8125rem] text-muted-foreground">{a.status === "delivered" ? `Submitted work · ${a.projectTitle}` : `Applied · ${a.projectTitle} · ${ago(a.createdAt)}`}</span>
            </span>
            {a.status === "delivered"
              ? <span className="inline-flex h-[1.375rem] shrink-0 items-center rounded bg-[#fef3c7] px-2 text-xs font-medium text-[#92400e]">Review the work</span>
              : <span className="hidden shrink-0 text-[0.8125rem] text-muted-foreground sm:inline">{pastLabel(a.pastCount, a.avgRating)}</span>}
          </Link>
        ))}
      </section>

      <section className={cn(card, "overflow-hidden")}>
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="flex flex-col gap-0.5"><h2 className="text-base font-semibold">Your projects</h2><span className="text-[0.8125rem] text-muted-foreground">How each one is moving forward, from creation to verified work</span></div>
          <Link href="/company/projects" className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground">All projects</Link>
        </div>
        {active.length === 0 ? (
          <div className="border-t border-zinc-100 px-5 py-5 text-sm text-muted-foreground">Nothing in motion yet. <Link href="/company/projects/new" className="font-medium text-foreground underline underline-offset-4">Create your next project</Link> and IE students can start applying.</div>
        ) : (
          <div className="overflow-x-auto border-t border-zinc-100">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-panel"><tr><th className={th}>Project</th><th className={th}>Stage</th><th className={th}>Student</th><th className={cn(th, "text-right")}>Value</th><th className={th}>Next step</th></tr></thead>
              <tbody>
                {active.map((r) => {
                  const [ring] = r.stage.colors;
                  return (
                    <tr key={r.project.id} className="relative border-t border-zinc-100 hover:bg-panel">
                      <td className="max-w-[16rem] px-5 py-3">
                        <Link href={rowHref(r)} className="block truncate font-medium after:absolute after:inset-0">{r.project.title}</Link>
                        <CategoryChip category={r.project.category} className="mt-1" />
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex h-[1.375rem] items-center rounded px-2 text-xs font-medium", toneClass(r.stage.tone))}>{r.stage.label}</span>
                        <div className="mt-1.5 flex w-28 gap-0.5" title={`Step ${r.stage.step + 1} of ${COMPANY_STEPS.length}`}>
                          {COMPANY_STEPS.map((s, i) => <span key={s} className="h-1 flex-1 rounded-full" style={{ background: i <= r.stage.step ? ring : "#e2e8f0" }} />)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-700">{r.hired ? r.hired.name : r.waiting ? `${r.waiting} applicant${r.waiting === 1 ? "" : "s"}` : "–"}</td>
                      <td className="px-5 py-3 text-right font-mono">{eur(r.project.priceEur)}</td>
                      <td className="max-w-[18rem] px-5 py-3 text-[0.8125rem] text-muted-foreground"><span className="line-clamp-2">{nextStep(r)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
