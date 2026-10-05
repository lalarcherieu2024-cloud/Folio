import { ArrowRight, Briefcase, Building2, Camera, Check, ClipboardList, Code, Megaphone, Palette, PenLine, Search, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { campusQuirk } from "@/components/marketing/fonts";
import { WorkflowDemo } from "@/components/marketing/WorkflowDemo";
import { CATEGORIES, type Category, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";


// The three things visitors need to trust before signing up. Header links point at these ids.
// Keep the copy in step with what's built: escrow is marked "soon" until payments go live.
const PILLARS: { id: string; icon: LucideIcon; label: string; title: string; points: { text: string; soon?: boolean }[] }[] = [
  { id: "getting-paid", icon: Wallet, label: "For students", title: "How you get paid", points: [
    { text: "The price is fixed and agreed before you start. No haggling halfway through." },
    { text: "Add your payout link to your profile, and track every project's payment on your Payments page." },
    { text: "The client pays into escrow when work starts, and it's released to you when they verify your work.", soon: true },
  ] },
  { id: "hiring", icon: Building2, label: "For companies", title: "How hiring works", points: [
    { text: "Folio verifies your company before your first project goes live." },
    { text: "You set the price and a “done when” test up front, so everyone knows what finished means." },
    { text: "Students apply with a pitch and CV, and you can see their past ratings before you accept." },
    { text: "You check the delivery against your test, then rate the work and sign it off." },
  ] },
  { id: "trust", icon: ShieldCheck, label: "For everyone", title: "Trust & accountability", points: [
    { text: "Verified on both sides: university email, GitHub and LinkedIn for students, a Folio review for companies." },
    { text: "The “done when” test, agreed before work begins, settles when a project is finished." },
    { text: "Every finished project leaves a signed rating and review that future clients can see." },
  ] },
];

// Catalog of every field a project can be posted in, with typical tasks.
const FIELDS: Record<Category, { icon: LucideIcon; blurb: string; tasks: string[] }> = {
  "Tech & Data": { icon: Code, blurb: "Build tools, clean data and make numbers useful.", tasks: ["Websites", "Dashboards", "Data cleanup", "Automations"] },
  "Design & Creative": { icon: Palette, blurb: "Give a brand or product a look people remember.", tasks: ["Logos", "Brand kits", "UI mockups", "Social graphics"] },
  "Marketing & Growth": { icon: Megaphone, blurb: "Find customers and keep them coming back.", tasks: ["Social plans", "Email campaigns", "SEO audits", "Ad tests"] },
  "Business & Finance": { icon: Briefcase, blurb: "Model the money and sharpen the plan.", tasks: ["Financial models", "Pricing", "Pitch decks", "Business plans"] },
  "Research & Analysis": { icon: Search, blurb: "Answer a question with evidence.", tasks: ["Market research", "Competitor scans", "Surveys", "Interviews"] },
  "Writing & Content": { icon: PenLine, blurb: "Say it clearly, in the right voice.", tasks: ["Blog posts", "Web copy", "Newsletters", "Translation"] },
  "Video & Photo": { icon: Camera, blurb: "Show the product, the team or the story.", tasks: ["Short videos", "Product photos", "Editing", "Event coverage"] },
  "Operations & Admin": { icon: ClipboardList, blurb: "Make the day-to-day run smoother.", tasks: ["Process docs", "Supplier research", "Spreadsheets", "Scheduling"] },
};

export function Landing({ projects, counts }: { projects: Project[]; counts: Record<string, number> }) {
  return (
    <div className={cn(campusQuirk, "mx-auto w-full max-w-[75rem] px-6")}>
      <section id="how" className="grid scroll-mt-20 items-center gap-10 pb-16 pt-6 md:gap-12 md:pt-10 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <h1 className="text-[clamp(2.5rem,5.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Real projects.<br />Real pay.<br /><span className="text-brand-mid">Real proof.</span></h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-zinc-600">Take paid projects from startups, small businesses and fellow students, in any field. Every finished project becomes a credential the client signs.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4 text-sm")}>Create your account <ArrowRight className="size-4" /></Link>
            <Link href="/projects" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4 text-sm")}>See open projects</Link>
          </div>
        </div>
        <WorkflowDemo />
      </section>

      <section className="border-t py-10">
        <h2 className="text-2xl font-semibold tracking-tight">How Folio works</h2>
        <p className="mb-6 mt-1.5 text-muted-foreground">What students, companies and Folio each commit to.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {PILLARS.map(({ id, icon: Icon, label, title, points }) => (
            <div key={id} id={id} className="flex scroll-mt-24 flex-col rounded-xl border bg-white p-6">
              <span className="grid size-10 place-items-center rounded-lg bg-panel text-brand"><Icon className="size-5" /></span>
              <span className="mt-4 font-mono text-xs font-medium uppercase tracking-wide text-brand">{label}</span>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">{title}</h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600">
                {points.map((p) => (
                  <li key={p.text} className="flex gap-2.5">
                    <Check className="mt-1 size-3.5 shrink-0 text-brand" strokeWidth={3} />
                    <span>
                      {p.soon && <span className="mr-1.5 inline-flex h-5 items-center rounded-md bg-soft px-1.5 align-[1px] text-[0.6875rem] font-medium text-brand">Coming soon</span>}
                      {p.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className="scroll-mt-20 border-t py-10">
        <h2 className="text-2xl font-semibold tracking-tight">Projects in every field</h2>
        <p className="mb-6 mt-1.5 text-muted-foreground">Everything that can be posted on Folio, and the kind of work it covers.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const { icon: Icon, blurb, tasks } = FIELDS[c];
            const n = counts[c] ?? 0;
            return (
              <Link key={c} href={`/signin?next=${encodeURIComponent(`/projects?category=${c}`)}`} className="group flex flex-col rounded-xl border bg-white p-5 transition-colors hover:border-brand">
                <span className="grid size-10 place-items-center rounded-lg bg-panel text-brand transition-colors group-hover:bg-soft"><Icon className="size-5" /></span>
                <h3 className="mt-4 text-base font-semibold">{c}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{blurb}</p>
                <ul className="mt-4 flex flex-1 flex-wrap content-start gap-1.5">
                  {tasks.map((t) => <li key={t} className="rounded-md bg-panel px-2 py-1 text-xs text-zinc-600">{t}</li>)}
                </ul>
                <span className={cn("mt-5 border-t pt-3 text-[0.8125rem] font-medium", n ? "text-brand" : "text-muted-foreground")}>
                  {n ? `${n} open project${n === 1 ? "" : "s"} →` : "No open projects yet"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t py-10">
        <div className="mb-5 flex items-baseline justify-between"><h2 className="text-2xl font-semibold tracking-tight">Open now</h2><Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">See all {projects.length} →</Link></div>
        <div className="stagger grid gap-4 md:grid-cols-3">{projects.slice(0, 3).map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      </section>

      <section className="py-10">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-primary p-10 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight">Your first credential is one project away.</h2>
          <Link href="/signup" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-10 bg-white px-4 text-sm text-primary hover:bg-soft")}>Create your account <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t py-8 text-[0.8125rem] text-muted-foreground">
        <span>Folio · IE University, Madrid</span><span>Company &amp; SME accounts coming soon</span>
      </footer>
    </div>
  );
}
