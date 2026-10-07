import { ArrowRight, CalendarClock, Check, MessageSquare, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ApplicantActions } from "@/components/startup/ApplicantActions";
import { ago, card, chip, PageHeader, pastLabel, TONES } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyApplicants, getCompanyProjects, type Applicant } from "@/lib/data/startup";
import { cn } from "@/lib/utils";
import { interviewWhen } from "@/lib/work";

export const metadata = { title: "Applicants · Folio" };

// Waiting on you first: undecided applicants (new or interviewing), then work to verify, then everything already decided.
const order = (a: Applicant) => (a.status === "pending" || a.status === "interview" ? 0 : a.status === "delivered" && a.projectStatus !== "verified" ? 1 : 2);

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
      <PageHeader title="Applicants" sub="Accepting a student declines the other applicants on that project." />

      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Filter by project" className="flex flex-col gap-0.5">
          <div className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">Project</div>
          {filters.map((f) => (
            <Link key={f.id} href={f.id === "all" ? "/company/applicants" : `/company/applicants?project=${f.id}`} aria-current={f.id === filter ? "page" : undefined}
              className={cn("flex min-h-[2.125rem] items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors", f.id === filter ? "bg-soft font-medium text-primary" : "text-zinc-600 hover:bg-[#eef4f8] hover:text-foreground")}>
              <span className="leading-snug">{f.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{f.count}</span>
            </Link>
          ))}
        </nav>

        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{list.length} applicant{list.length === 1 ? "" : "s"} <span className="font-mono text-sm font-normal text-muted-foreground">· {toReview} to review</span></h2>
          {list.length === 0 && (
            <EmptyState icon={Users} title="No applicants yet" body="Students who apply show up here with their CV, skills and pitch.">
              <Link href="/company/projects" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>See your projects <ArrowRight className="size-4" /></Link>
            </EmptyState>
          )}
          <div className="stagger flex flex-col gap-3">
            {list.map((a) => {
              const working = a.status === "accepted" || a.status === "delivered";
              return (
                <article key={a.id} className={cn(card, "flex flex-wrap items-center gap-4 p-5", working && "border-[#16a34a] shadow-[inset_4px_0_0_#16a34a]", a.status === "declined" && "opacity-60")}>
                  <UserAvatar name={a.name} color={a.avatarColor} url={a.avatarUrl} className="size-11 rounded-lg text-sm" />
                  <Link href={`/company/applicants/${a.id}`} className="group flex min-w-0 flex-[1_1_14rem] flex-col gap-1">
                    <span className="text-base font-semibold leading-tight group-hover:underline">{a.name}</span>
                    <span className="text-[0.8125rem] text-muted-foreground">{a.program || "IE student"} · {a.projectTitle} · {ago(a.createdAt)}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {a.status === "interview" && a.interview && (
                        <span className={cn(chip, "bg-[#cffafe] text-[#155e75]")}><CalendarClock className="size-3" />Interview {interviewWhen(a.interview.at)}{a.interview.confirmedAt ? " · confirmed" : ""}</span>
                      )}
                      {working && <span className={cn(chip, TONES.info)}><MessageSquare className="size-3" />Messages</span>}
                      {a.githubVerified && <span className={cn(chip, TONES.success)}><Check className="size-3" strokeWidth={3} />GitHub</span>}
                      {a.linkedinVerified && <span className={cn(chip, TONES.success)}><Check className="size-3" strokeWidth={3} />LinkedIn</span>}
                      <span className={cn(chip, a.pastCount ? TONES.success : TONES.muted)}>{pastLabel(a.pastCount, a.avgRating)}</span>
                      {!a.hasCv && <span className={cn(chip, TONES.warning)}>No CV</span>}
                    </span>
                  </Link>
                  <ApplicantActions a={a} />
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
