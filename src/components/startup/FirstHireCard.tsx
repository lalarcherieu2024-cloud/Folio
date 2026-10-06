import { ArrowRight, BookOpen, Check } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { HIRE_STAGES } from "@/lib/first-hire";
import { cn } from "@/lib/utils";
import { card } from "./ui";

/** "Your first hire" on the company home: the five stages of hiring someone, each ticked off from what the company
 *  has already done, with the current one spelled out and one button to do it. Shown until a first project is
 *  verified. */
export function FirstHireCard({ done, hrefs }: { done: boolean[]; hrefs: string[] }) {
  const current = Math.max(0, done.findIndex((d) => !d));
  const stage = HIRE_STAGES[current];
  return (
    <section className={cn(card, "flex flex-col gap-5 p-5 md:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold">Your first hire</h2>
          <span className="text-[0.8125rem] text-muted-foreground">What hiring someone involves, one step at a time.</span>
        </div>
        <Link href="/company/hiring-guide" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><BookOpen className="size-3.5" />Hiring guide</Link>
      </div>

      <ol className="grid grid-cols-5 gap-1.5">
        {HIRE_STAGES.map((s, i) => (
          <li key={s.key} className="flex min-w-0 flex-col gap-2" aria-current={i === current ? "step" : undefined}>
            <span className={cn("h-1 rounded-full", done[i] ? "bg-[#16a34a]" : i === current ? "bg-brand" : "bg-zinc-200")} />
            <span className={cn("hidden items-center gap-1 text-xs sm:flex", i === current ? "font-semibold text-foreground" : done[i] ? "text-muted-foreground" : "text-zinc-400")}>
              {done[i] && <Check className="size-3 shrink-0 text-[#16a34a]" strokeWidth={3} />}<span className="truncate">{s.title}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-panel px-4 py-3.5">
        <div className="flex min-w-[14rem] flex-1 flex-col gap-0.5">
          <span className="text-xs font-medium text-brand">Step {current + 1} of {HIRE_STAGES.length}</span>
          <span className="text-sm font-semibold">{stage.title}</span>
          <span className="text-[0.8125rem] text-zinc-600">{stage.line} <Link href={`/company/hiring-guide#${stage.key}`} className="underline underline-offset-2 hover:text-foreground">More</Link></span>
        </div>
        <Link href={hrefs[current]} className={cn(buttonVariants(), "h-9 shrink-0 gap-1.5 px-3.5")}>
          {["Write the brief", "Publish it", "See applicants", "Open the conversation", "Review the work"][current]}<ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
