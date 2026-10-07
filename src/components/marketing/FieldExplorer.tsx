"use client";

import { ArrowRight, Briefcase, Camera, ClipboardList, Code, Megaphone, Palette, PenLine, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FIELD_TONES } from "@/lib/fields";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";

// "Projects in every field" on the front page: every field in a list, each in its own colour (the same as on project
// cards in the app), and one open at a time with its typical work and the real projects open in it right now. While
// it's on screen it moves on by itself, field by field; hovering pauses it, and picking a field stops it.

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

export type FieldSummary = {
  category: Category; count: number;
  projects: { id: string; title: string; org: string; price: number; weeks: number }[]; // the newest few open ones
};

const STEP_MS = 5000;
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => { const m = window.matchMedia(REDUCED); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);

export function FieldExplorer({ fields }: { fields: FieldSummary[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [picked, setPicked] = useState(false); // someone chose a field: it stays there
  const auto = visible && !paused && !picked && !still;

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % fields.length), STEP_MS);
    return () => clearTimeout(t);
  }, [auto, active, fields.length]);

  const f = fields[active];
  const { icon: Icon, blurb, tasks } = FIELDS[f.category];
  const tone = (c: Category) => ({ "--tone": FIELD_TONES[c].fg, "--tint": FIELD_TONES[c].bg }) as React.CSSProperties;
  const pick = (i: number) => { setActive(i); setPicked(true); };

  return (
    <div ref={ref} className="mt-9 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {/* The fields: a column on the right on wide screens, a row you can swipe (above the panel) on phones. */}
      <div role="tablist" aria-label="Fields" className="-mx-6 flex snap-x gap-1.5 overflow-x-auto px-6 pb-1 lg:order-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:bg-panel lg:p-2">
        {fields.map((x, i) => {
          const on = i === active;
          const XIcon = FIELDS[x.category].icon;
          return (
            <button key={x.category} type="button" role="tab" aria-selected={on} onClick={() => pick(i)} style={tone(x.category)}
              className={cn("relative flex shrink-0 snap-start items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm transition-colors lg:border-transparent",
                on ? "border-[color-mix(in_srgb,var(--tone)_30%,transparent)] bg-white font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,.05)]" : "bg-white text-zinc-600 hover:text-foreground lg:bg-transparent lg:hover:bg-white/70")}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--tint)] text-[var(--tone)]"><XIcon className="size-3.5" /></span>
              <span className="whitespace-nowrap lg:flex-1">{x.category}</span>
              <span className={cn("hidden rounded-full px-1.5 text-xs tabular-nums lg:inline", x.count ? "bg-[var(--tint)] text-[var(--tone)]" : "text-zinc-400")}>{x.count}</span>
              {/* How long until it moves on. Restarts with each field. */}
              {on && auto && <span key={active} aria-hidden className="field-progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[var(--tone)]" style={{ animationDuration: `${STEP_MS}ms` }} />}
            </button>
          );
        })}
      </div>

      {/* The open field: what the work looks like (on a flat tint of its colour, with its icon as a faint watermark),
          and what's open in it right now. Crisp colour, no glows. */}
      <div role="tabpanel" aria-label={f.category} style={tone(f.category)} className="grid grid-cols-1 overflow-hidden rounded-2xl border bg-white lg:order-1">
        <div key={f.category} className="field-in grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="relative flex flex-col overflow-hidden border-b bg-[color-mix(in_srgb,var(--tint)_55%,white)] p-6 md:border-b-0 md:border-r md:border-r-[color-mix(in_srgb,var(--tone)_12%,transparent)] md:p-8">
            <Icon aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 size-44 rotate-[-8deg] text-[var(--tone)] opacity-[.07]" strokeWidth={1.25} />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-white text-[var(--tone)] shadow-[0_1px_2px_rgba(0,0,0,.05)] ring-1 ring-[color-mix(in_srgb,var(--tone)_14%,transparent)]"><Icon className="size-6" /></span>
            <h3 className="relative mt-4 text-xl font-semibold tracking-tight">{f.category}</h3>
            <p className="relative mt-1.5 text-[0.9375rem] leading-relaxed text-zinc-700">{blurb}</p>
            <p className="relative mt-5 text-xs font-medium text-[color-mix(in_srgb,var(--tone)_75%,#52525b)]">Typical work</p>
            <ul className="relative mt-2 flex flex-wrap gap-1.5">
              {tasks.map((t) => <li key={t} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[var(--tone)] ring-1 ring-[color-mix(in_srgb,var(--tone)_14%,transparent)]">{t}</li>)}
            </ul>
          </div>

          <div className="flex flex-col p-6 md:p-8">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", f.count ? "bg-[var(--tone)]" : "bg-zinc-300")} />
              {f.count ? `Open now · ${f.count} project${f.count === 1 ? "" : "s"}` : "Open now"}
            </p>
            {f.projects.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-2">
                {f.projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="group flex items-center gap-3 rounded-xl border bg-white/80 px-3.5 py-3 transition-colors hover:border-[color-mix(in_srgb,var(--tone)_35%,transparent)] hover:bg-white">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">{p.title}</span>
                        <span className="truncate text-xs text-muted-foreground">{p.org} · {weeksLabel(p.weeks)}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--tone)]">{eur(p.price)}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 flex flex-1 flex-col items-start justify-center gap-2 rounded-xl border border-dashed bg-white/70 px-4 py-5 text-sm text-zinc-600">
                Nothing open in {f.category} right now. New briefs come in every week.
                <Link href="/company/signup" className="font-medium text-[var(--tone)] underline-offset-4 hover:underline">Have one? Post it</Link>
              </div>
            )}
            {f.count > 0 && (
              <Link href={`/projects?category=${encodeURIComponent(f.category)}`} className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--tone)] underline-offset-4 hover:underline">
                See all {f.category} projects<ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
