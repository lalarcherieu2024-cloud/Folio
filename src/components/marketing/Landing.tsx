import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { campusQuirk } from "@/components/marketing/fonts";
import { ForCompanies, ForStudents, MoneySection, WhatIf } from "@/components/marketing/HowFolioWorks";
import { FieldExplorer, type FieldSummary } from "@/components/marketing/FieldExplorer";
import { WorkflowDemo } from "@/components/marketing/WorkflowDemo";
import { CATEGORIES, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur } from "@/lib/work";

export function Landing({ projects, counts, paymentsLive = false }: { projects: Project[]; counts: Record<string, number>; paymentsLive?: boolean }) {
  const prices = projects.map((p) => p.priceEur);
  const priceRange = prices.length ? `${eur(Math.min(...prices))}–${eur(Math.max(...prices))}` : null;
  // Per field: how many are open, and the newest few to show (projects come newest first).
  const fields: FieldSummary[] = CATEGORIES.map((category) => ({
    category, count: counts[category] ?? 0,
    projects: projects.filter((p) => p.category === category).slice(0, 3)
      .map((p) => ({ id: p.id, title: p.title, org: p.orgName ?? p.clientName, price: p.priceEur, weeks: p.weeks })),
  }));
  return (
    <div className={cn(campusQuirk, "mx-auto w-full max-w-[75rem] px-6")}>
      <section id="how" className="grid scroll-mt-24 items-center gap-10 pb-6 pt-1 md:gap-12 md:pb-8 md:pt-4 md:grid-cols-[1.1fr_.9fr]">
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

      {/* Every field, with what's open in it right now (FieldExplorer). Then the questions people still have, last
          before the sign-up band. */}
      <section id="projects" className="section-rule scroll-mt-24 py-14 md:py-20">
        <p className="text-sm font-medium text-brand">Every field</p>
        <h2 className="mt-2 text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1] tracking-tight">Projects in every field</h2>
        <p className="mt-3 max-w-[34rem] text-pretty text-lg leading-relaxed text-zinc-600">From a logo to a financial model: everything that can be posted on Folio, and the work it covers.</p>
        <FieldExplorer fields={fields} />
      </section>

      <WhatIf />

      <section className="py-10">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-primary p-10 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-[20ch] text-3xl font-semibold leading-tight tracking-tight">Your first credential is one project away.</h2>
          <Link href="/signup" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "h-10 bg-white px-4 text-sm text-primary hover:bg-soft")}>Create your account <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </div>
  );
}
