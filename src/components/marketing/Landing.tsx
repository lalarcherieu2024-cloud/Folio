import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CredentialCard } from "@/components/shared/CredentialCard";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { SAMPLE_CREDENTIALS } from "@/lib/mock-data";
import { CATEGORIES, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/work";

const STEPS = [
  ["01", "Post or find a brief", "Startups, small businesses and students post a fixed-price project with a clear finish line."],
  ["02", "Apply with a pitch", "Send a short pitch and your CV. The client picks who fits."],
  ["03", "Deliver the work", "One to six weeks, checked against a “done when” test agreed up front."],
  ["04", "Get verified", "The client signs a rating and review. It becomes a credential on your record."],
];

export function Landing({ projects, counts }: { projects: Project[]; counts: Record<string, number> }) {
  const prices = projects.map((p) => p.priceEur);
  return (
    <div className="mx-auto w-full max-w-[75rem] px-6">
      <section className="grid items-center gap-12 pb-16 pt-20 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[0.8125rem] font-medium"><span className="size-1.5 rounded-full bg-lime" />For IE University students</span>
          <h1 className="mt-6 text-[clamp(2.5rem,5.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Real projects.<br />Real pay.<br /><span className="text-lime">Real proof.</span></h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-zinc-600">Take paid projects from startups, small businesses and fellow students, in any field. Every finished project becomes a credential the client signs.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4 text-sm")}>Create your account <ArrowRight className="size-4" /></Link>
            <Link href="/projects" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4 text-sm")}>See open projects</Link>
          </div>
          <p className="mt-5 text-[0.8125rem] text-muted-foreground">{projects.length} open projects · paid {prices.length ? `${eur(Math.min(...prices))}–${eur(Math.max(...prices))}` : "per project"} · sign in with your @student.ie.edu email</p>
        </div>
        <div className="grid gap-5">
          {SAMPLE_CREDENTIALS.map((c, i) => <CredentialCard key={c.id} c={c} className={i === 0 ? "-rotate-1" : "translate-x-3 rotate-1"} />)}
        </div>
      </section>

      <section id="projects" className="scroll-mt-20 border-t py-10">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">Projects in every field</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/signin?next=${encodeURIComponent(`/projects?category=${c}`)}`} className="group inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-sm transition-colors hover:border-lime hover:text-lime">
              {c}<span className="font-mono text-xs text-zinc-400 group-hover:text-lime">{counts[c] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t py-10">
        <div className="mb-5 flex items-baseline justify-between"><h2 className="text-2xl font-semibold tracking-tight">Open now</h2><Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">See all {projects.length} →</Link></div>
        <div className="stagger grid gap-4 md:grid-cols-3">{projects.slice(0, 3).map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      </section>

      <section id="how" className="scroll-mt-20 border-t py-10">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, t, d]) => (
            <div key={n} className="rounded-xl border bg-panel p-5">
              <span className="font-mono text-sm font-medium text-lime">{n}</span>
              <h3 className="mt-3 text-base font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-primary p-10 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight">Your first credential is one project away.</h2>
          <Link href="/signup" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-10 bg-[#bbf7d0] px-4 text-sm text-[#14532d] hover:bg-[#86efac]")}>Create your account <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t py-8 text-[0.8125rem] text-muted-foreground">
        <span>Folio · IE University, Madrid</span><span>Company &amp; SME accounts coming soon</span>
      </footer>
    </div>
  );
}
