import { cn } from "@/lib/utils";

const day = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD in local time
const WEEKS = 26;
const LEVEL = ["bg-zinc-100", "bg-[#bbf7d0]", "bg-[#4ade80]", "bg-[#16a34a]"];

// A contribution-style grid of the last 26 weeks, built from real events:
// applications sent, projects accepted and credentials earned.
export function ActivityHeatmap({ dates }: { dates: string[] }) {
  const counts = new Map<string, number>();
  for (const iso of dates) { const k = day(new Date(iso)); counts.set(k, (counts.get(k) ?? 0) + 1); }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // this week's Monday
  const start = new Date(monday); start.setDate(monday.getDate() - (WEEKS - 1) * 7);

  const cells = Array.from({ length: WEEKS * 7 }, (_, n) => { const d = new Date(start); d.setDate(start.getDate() + n); return { d, c: counts.get(day(d)) ?? 0, future: d > today }; });
  const activeWeeks = Array.from({ length: WEEKS }, (_, w) => cells.slice(w * 7, w * 7 + 7).some((x) => x.c > 0)).filter(Boolean).length;
  const total = cells.reduce((n, x) => n + x.c, 0);
  const level = (c: number) => (c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : 3);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Activity</h2>
        <span className="text-[0.8125rem] text-muted-foreground">{total === 0 ? "Your activity shows up here as you apply and deliver." : <><span className="font-mono">{activeWeeks}</span> active week{activeWeeks === 1 ? "" : "s"} in the last 6 months</>}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white p-4">
        <div className="mx-auto grid max-w-[60rem] grid-flow-col grid-rows-7 auto-cols-fr gap-1">
          {cells.map(({ d, c, future }, n) => (
            <span
              key={n}
              title={future ? "" : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${c} event${c === 1 ? "" : "s"}`}
              className={cn("aspect-square w-full rounded-[0.25rem] transition-transform hover:scale-125", future ? "opacity-0" : LEVEL[level(c)])}
              style={{ animation: future ? undefined : `fade-up .5s ${Math.min(n, 150) * 4}ms cubic-bezier(.2,.8,.2,1) both` }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[0.6875rem] text-muted-foreground">
          Less {LEVEL.map((l) => <span key={l} className={cn("size-3 rounded-[0.1875rem]", l)} />)} More
        </div>
      </div>
    </section>
  );
}
