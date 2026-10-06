import { Award, Check, Lock } from "lucide-react";
import { milestones } from "@/lib/work";
import { cn } from "@/lib/utils";

export type Milestone = { key: string; title: string; hint: string; done: boolean; progress: string };

export function Milestones({ creds }: { creds: { rating: number; category: string; priceEur: number }[] }) {
  return <MilestoneGrid list={milestones(creds)} />;
}

/** The milestone cards themselves; the company "Impact" page passes its own list. */
export function MilestoneGrid({ list }: { list: Milestone[] }) {
  const got = list.filter((m) => m.done).length;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Milestones</h2>
        <span className="font-mono text-[0.8125rem] text-muted-foreground">{got}/{list.length} earned</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3">
        {list.map((m) => (
          <div key={m.key} className={cn("flex flex-col gap-2 rounded-xl border p-4", m.done ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-dashed border-zinc-300 bg-white")}>
            <span className={cn("grid size-9 place-items-center rounded-lg", m.done ? "bg-[#dcfce7] text-[#166534]" : "bg-muted text-zinc-400")}>{m.done ? <Award className="size-[1.125rem]" /> : <Lock className="size-4" />}</span>
            <span className={cn("text-sm font-semibold", !m.done && "text-zinc-500")}>{m.title}</span>
            <span className="text-xs text-muted-foreground">{m.done ? <span className="inline-flex items-center gap-1 font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />Earned</span> : <>{m.hint}<br /><span className="font-mono text-zinc-500">{m.progress}</span></>}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
