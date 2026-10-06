import { Check, Clock, Sparkles, Sprout } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/shared/BackButton";
import { PublicWrap } from "@/components/shared/PublicWrap";
import { AboutBlock } from "@/components/student/AboutBlock";
import { ApplyDialog } from "@/components/student/ApplyDialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getProject } from "@/lib/data/projects";
import { getApplicationFor, getSavedIds } from "@/lib/data/student";
import { cn } from "@/lib/utils";
import { eur, statusInfo, viewerFrom, weeksLabel, whyFits } from "@/lib/work";

export async function generateMetadata(props: PageProps<"/projects/[id]">) {
  const p = await getProject((await props.params).id);
  return { title: p ? `${p.title} · Folio` : "Project · Folio" };
}

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const project = await getProject(id);
  if (!project) notFound();
  const p = project;

  const user = await getSession();
  const [application, savedIds] = user ? await Promise.all([getApplicationFor(user, p.id), getSavedIds(user)]) : [undefined, []];
  const viewer = viewerFrom(user, savedIds);
  const fit = user ? whyFits(p, viewer) : null;
  const mine = new Set(viewer.skills);
  const name = p.orgName ?? p.clientName;

  const stats = [["Pay", eur(p.priceEur)], ["Duration", weeksLabel(p.weeks)], ["Applicants", String(p.applicantCount)]];

  return (
    <PublicWrap signedIn={!!user}>
      <div className="page-enter flex flex-col gap-6">
        <BackButton fallback="/projects" label="Back to projects" />

        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted-foreground">
            <span className="font-medium text-foreground">{name}</span>
            {p.orgVerified && <Badge variant="outline" className="h-5 gap-1 rounded-md px-1.5 text-[0.6875rem] text-[#166534]"><Check className="size-3" />Verified</Badge>}
            <span>· {p.hood}</span>
          </div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em]">{p.title}</h1>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-7">
            {fit && <p className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#f0fdf4] px-3 py-2 text-sm font-medium text-[#166534]"><Sparkles className="size-4" />Why this fits you: {fit}</p>}
            <p className="text-[1.0625rem] leading-relaxed">{p.summary}</p>
            <AboutBlock p={p} />

            <section>
              <h2 className="mb-3 text-base font-semibold">What you&apos;ll hand in</h2>
              <ul className="space-y-2.5">
                {p.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-[0.9375rem]">
                    <span className="mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded border bg-white"><Check className="size-3 text-zinc-400" strokeWidth={3} /></span>{d}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border bg-panel p-5">
              <h2 className="mb-1 text-base font-semibold">You&apos;re finished when…</h2>
              <p className="text-[0.9375rem] text-muted-foreground">{p.doneWhen}</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-semibold">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="rounded-md px-2 text-xs font-medium">{p.category}</Badge>
                {p.skills.map((s) => {
                  const match = mine.has(s.toLowerCase());
                  return (
                    <Badge key={s} variant="secondary" title={match ? "On your profile" : "Not on your profile yet"} className={cn("gap-1 rounded-md px-2 text-xs font-medium", match ? "border border-[#bbf7d0] bg-[#dcfce7] text-[#166534]" : "text-zinc-800")}>
                      {match && <Check className="size-3" strokeWidth={3} />}{s}
                    </Badge>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              <div className="grid grid-cols-3 border-b">
                {stats.map(([k, v], i) => (
                  <div key={k} className={cn("flex flex-col gap-0.5 px-4 py-4", i > 0 && "border-l")}>
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="font-mono text-sm font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              {(p.hoursPerWeek || p.beginnerFriendly || p.learn.length > 0) && (
                <div className="flex flex-col gap-1.5 border-b px-4 py-4 text-sm">
                  {p.hoursPerWeek && <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" />About {p.hoursPerWeek} hours a week</span>}
                  {p.beginnerFriendly && <span className="inline-flex items-center gap-1.5 font-medium text-[#166534]"><Sprout className="size-4" />Good first project</span>}
                  {p.learn.length > 0 && <span className="text-muted-foreground">You&apos;ll learn: <span className="font-medium text-foreground">{p.learn.join(", ")}</span></span>}
                </div>
              )}
              <div className="flex flex-col gap-3 bg-panel p-4">
                {!user ? (
                  <Link href={`/signin?next=${encodeURIComponent(`/projects/${p.id}`)}`} className={cn(buttonVariants({ size: "lg" }), "h-10 w-full px-4 text-sm")}>Sign in to apply</Link>
                ) : application ? (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3.5 py-2.5 text-sm">
                    <span>You applied · <span className="font-medium">{statusInfo(application, p).label}</span></span>
                    <Link href="/applications" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3")}>Track</Link>
                  </div>
                ) : p.status !== "open" ? (
                  <p className="rounded-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">This project is no longer taking applications.</p>
                ) : !user.cv ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Add your CV to apply. Clients read it with your application.</p>
                    <Link href="/profile" className={cn(buttonVariants(), "h-9 px-3.5")}>Upload CV</Link>
                  </div>
                ) : (
                  <ApplyDialog projectId={p.id} client={name} cvName={user.cv.fileName} fileCount={user.fileCount} />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicWrap>
  );
}
