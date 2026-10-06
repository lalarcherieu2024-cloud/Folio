import { ArrowRight, Briefcase, Camera, ClipboardList, Code, Megaphone, Palette, PenLine, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { campusQuirk } from "@/components/marketing/fonts";
import { ForCompanies, ForStudents, MoneySection, WhatIf } from "@/components/marketing/HowFolioWorks";
import { WorkflowDemo } from "@/components/marketing/WorkflowDemo";
import { CATEGORIES, type Category, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/work";

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

export function Landing({ projects, counts, paymentsLive = false }: { projects: Project[]; counts: Record<string, number>; paymentsLive?: boolean }) {
  const prices = projects.map((p) => p.priceEur);
  const priceRange = prices.length ? `${eur(Math.min(...prices))}–${eur(Math.max(...prices))}` : null;
  return (
    <div className={cn(campusQuirk, "mx-auto w-full max-w-[75rem] px-6")}>
      <section id="how" className="grid scroll-mt-20 items-center gap-10 pb-6 pt-1 md:gap-12 md:pb-8 md:pt-4 md:grid-cols-[1.1fr_.9fr]">
        {/* For both sides in one line; the demo next to it shows the rest. */}
        <div className="min-w-0">
          <h1 className="text-[clamp(2.5rem,5.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Real talent.<br />Real projects.<br /><span className="text-brand-mid">Real milestones.</span></h1>
          <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-zinc-600">Where startups and small businesses hire IE University students for paid, verified projects.</p>
        </div>
        <div className="min-w-0 md:translate-y-6"><WorkflowDemo /></div>
      </section>

      <ForCompanies />
      <MoneySection paymentsLive={paymentsLive} />
      <ForStudents priceRange={priceRange} />
      <WhatIf />

      <section id="projects" className="section-rule scroll-mt-20 py-12 md:py-14">
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

      <section className="py-10">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-primary p-10 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight">Your first credential is one project away.</h2>
          <Link href="/signup" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-10 bg-white px-4 text-sm text-primary hover:bg-soft")}>Create your account <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </div>
  );
}
