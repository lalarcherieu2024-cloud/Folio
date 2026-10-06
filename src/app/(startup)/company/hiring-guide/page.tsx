import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { card, PageHeader } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { HIRE_STAGES } from "@/lib/first-hire";
import { cn } from "@/lib/utils";

export const metadata = { title: "Hiring guide · Folio" };

// STARTUP INTERFACE. What hiring someone on Folio involves, for companies that have never hired (student founders
// especially). The same stages as the "Your first hire" card on the company home (lib/first-hire.ts).
export default async function HiringGuide() {
  await requireUser("/company/hiring-guide", "company");
  return (
    <div className="page-enter flex max-w-[47.5rem] flex-col gap-6">
      <Link href="/company" className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Home</Link>
      <PageHeader title="Hiring on Folio" sub="Never hired anyone before? Most people haven't. Here's what each step involves, and what makes it go well." />

      <ol className="flex flex-col gap-4">
        {HIRE_STAGES.map((s, i) => (
          <li key={s.key} id={s.key} className={cn(card, "flex scroll-mt-24 gap-4 p-5")}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-soft text-sm font-semibold text-brand">{i + 1}</span>
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="text-base font-semibold">{s.title}</h2>
              <p className="text-[0.9375rem] text-zinc-700">{s.line}</p>
              <ul className="mt-1 flex flex-col gap-1.5 text-sm text-zinc-600">
                {s.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-zinc-400" />{p}</li>)}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <section id="beyond" className="flex scroll-mt-24 flex-col gap-2 rounded-xl border border-dashed border-zinc-300 bg-panel p-5">
        <h2 className="text-base font-semibold">When you need someone for longer</h2>
        <p className="text-sm leading-relaxed text-zinc-600">
          A Folio project is one piece of work at a fixed price, not a job. Taking someone on for an internship or a job comes with a contract and its own obligations.
          IE&apos;s careers and entrepreneurship teams can walk you through it, and a gestor or lawyer can set it up properly.
        </p>
      </section>

      <Link href="/company/projects/new" className={cn(buttonVariants(), "h-10 w-fit gap-1.5 px-4")}>Write your brief<ArrowRight className="size-4" /></Link>
    </div>
  );
}
