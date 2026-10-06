"use client";

import { Award, BadgeCheck, CalendarClock, Check, Cloud, Lock, MousePointer2, Star } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

// The small product snippets beside the landing page's sections: the applicants list (hiring), the escrow (money)
// and the signed credential (students). Each plays its little story one beat at a time, slowly, while it's on
// screen, then starts again. Changes are CSS transitions driven by the current beat, so they ease into each other;
// nothing that moves also has a keyframe animation on the same property. With reduced motion each shows its
// finished state. The same three characters everywhere: Nubo Labs hires Lucía (Marco and Sara also apply).

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => { const m = window.matchMedia(REDUCED); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);

/** The current beat (0…ms.length-1) of a looping snippet; `ms[i]` is how long beat i lasts, `done` the beat shown
 *  with reduced motion. */
function useBeats(ms: number[], done = ms.length - 1) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (still) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [still]);
  useEffect(() => {
    if (!visible || still) return;
    const t = setTimeout(() => setBeat((b) => (b + 1) % ms.length), ms[beat]);
    return () => clearTimeout(t);
  }, [visible, still, beat, ms]);
  return { ref, beat: still ? done : beat };
}

// Transitions name their properties (never `all`), so they can't fight the keyframe animations below.
const ease = "duration-700 ease-[cubic-bezier(.22,1,.36,1)]";
const move = cn("transition-[opacity,translate,background-color,border-color,color]", ease);
const shown = (on: boolean) => (on ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1.5");
const frame = "rounded-2xl bg-panel p-4 sm:p-5";
const panel = "rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

/** Text that fades in when it changes, instead of snapping. */
const Swap = ({ k, className, children }: { k: string; className?: string; children: React.ReactNode }) => (
  <span key={k} className={cn("snip-in", className)}>{children}</span>
);

// ---------------------------------------------------------------- the characters

type Look = { skin: string; hair: string; shirt: string; bg: string; hairStyle: "long" | "short" | "bun" };
const LUCIA: Look = { skin: "#f1c3a1", hair: "#3d2a1f", shirt: "#5b9bbd", bg: "#dbeafe", hairStyle: "long" };
const MARCO: Look = { skin: "#c98f6c", hair: "#241d19", shirt: "#8b7cf6", bg: "#ede9fe", hairStyle: "short" };
const SARA: Look = { skin: "#f4d2ba", hair: "#a3532c", shirt: "#f59e0b", bg: "#fef3c7", hairStyle: "bun" };

/** A small illustrated portrait, so the people in the snippets read as people rather than initials. */
function Face({ look, className }: { look: Look; className?: string }) {
  const { skin, hair, shirt, bg, hairStyle } = look;
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("shrink-0 overflow-hidden rounded-full", className)}>
      <g>
        <rect width="48" height="48" fill={bg} />
        {hairStyle === "long" && <path d="M13 22c0-9 5-14 11-14s11 5 11 14v14c-4 2-18 2-22 0z" fill={hair} />}
        {hairStyle === "bun" && <circle cx="24" cy="8.5" r="5" fill={hair} />}
        <path d="M20.5 26h7v10h-7z" fill={skin} />
        <path d="M9 48c0-9 6.5-14 15-14s15 5 15 14z" fill={shirt} />
        <ellipse cx="24" cy="21" rx="8.5" ry="9.5" fill={skin} />
        <path fill={hair} d={
          hairStyle === "long" ? "M15.4 20c.4-6.6 4-10 8.6-10s8.4 3.4 8.6 10c-4.6-.8-8.4-3-10-5.6-1.4 2.6-3.8 4.6-7.2 5.6z"
          : hairStyle === "short" ? "M15.3 20.5c-.6-7 3.6-11 8.7-11s9.3 4 8.7 11c-1.4-3.2-4.2-4.6-8.7-4.6s-7.3 1.4-8.7 4.6z"
          : "M15.4 20c.2-6.4 3.8-10.2 8.6-10.2s8.4 3.8 8.6 10.2c-2.2-2.8-5-4.2-8.6-4.2s-6.4 1.4-8.6 4.2z"
        } />
      </g>
    </svg>
  );
}

/** Nubo Labs, the example company: a sky tile with a cloud. */
const NuboMark = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn("grid shrink-0 place-items-center bg-linear-to-br from-[#38bdf8] to-[#6366f1] text-white", className)}>
    <Cloud className="size-[58%] fill-current" strokeWidth={0} />
  </span>
);

// ---------------------------------------------------------------- hiring: a brief, applicants, an interview, a hire

const APPLICANTS = [
  { look: LUCIA, name: "Lucía F.", note: "2 projects · ★ 4.9" },
  { look: MARCO, name: "Marco R.", note: "First project" },
  { look: SARA, name: "Sara P.", note: "1 project · ★ 5.0" },
];
// 0 the brief is up · 1–3 applicants arrive · 4 Lucía gets an interview · 5 interviewed, the pointer goes to Hire
// · 6 Hire is clicked · 7 hired · 8 the list clears (with Lucía still hired, so nothing flips back while it's visible)
const HIRE_MS = [1600, 1100, 1000, 1000, 1800, 1500, 1000, 3200, 800];
const HIRE_STAGES = ["Posted", "Applicants", "Interview", "Hired"];

export function ApplicantsSnippet() {
  const { ref, beat } = useBeats(HIRE_MS, 7);
  const clearing = beat === 8;
  const count = clearing ? 0 : Math.min(3, beat);
  const interviewing = beat === 4, interviewed = beat >= 5, pointing = beat === 5 || beat === 6, clicking = beat === 6, hired = beat >= 7;
  const stage = beat === 0 ? 0 : beat <= 3 ? 1 : beat <= 6 ? 2 : 3;
  return (
    <div ref={ref} className={frame}>
      <div className={cn(panel, "p-4")}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <NuboMark className="size-6 rounded-md" />
            <span className="truncate font-semibold">Market research</span>
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            <Swap k={String(count)}>{count === 1 ? "1 applicant" : `${count} applicants`}</Swap>
          </span>
        </div>
        <div className="relative mt-3">
          {/* Before anyone applies: the brief is live (a real empty state, not empty slots). */}
          <p className={cn(move, shown(beat === 0), "absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground")}>
            <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-brand/40" /><span className="relative size-2 rounded-full bg-brand" /></span>
            Brief posted · waiting for applicants
          </p>
          <ul className="flex flex-col gap-2">
            {APPLICANTS.map((a, i) => {
              const lucia = i === 0;
              return (
                <li key={a.name} className={cn(move, "flex items-center gap-2.5 rounded-lg border px-3 py-2",
                  lucia && beat >= 4 ? "border-brand/40 bg-soft/60" : "bg-white",
                  i >= count ? "pointer-events-none translate-y-1.5 opacity-0" : !lucia && hired ? "opacity-40" : "opacity-100")}>
                  <Face look={a.look} className="size-8" />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {lucia && interviewed
                        ? <Swap k="interviewed" className="inline-flex items-center gap-1 font-medium text-brand"><Check className="size-3" strokeWidth={3} />Interviewed</Swap>
                        : <Swap k="note">{a.note}</Swap>}
                    </span>
                  </span>
                  {lucia && (
                    // One slot on the right: the interview, then the Hire button (its labels crossfade, so it never
                    // jumps in width), with a pointer that glides in and clicks it.
                    <span className="relative grid shrink-0 justify-items-end">
                      <span className={cn(move, "col-start-1 row-start-1 inline-flex h-7 items-center gap-1 self-center rounded-md bg-[#cffafe] px-2 text-xs font-medium text-[#155e75]",
                        interviewing ? "opacity-100" : "pointer-events-none opacity-0")}>
                        <CalendarClock className="size-3.5" />Tue 10:00
                      </span>
                      <span className={cn(move, "col-start-1 row-start-1 grid h-7 w-[4.75rem] place-items-center rounded-md text-xs font-medium",
                        hired ? "bg-[#dcfce7] text-[#15803d]" : "bg-primary text-primary-foreground", interviewed ? "opacity-100" : "opacity-0", clicking && "snip-press")}>
                        <span className={cn("col-start-1 row-start-1 transition-opacity duration-300", hired ? "opacity-0" : "opacity-100")}>Hire</span>
                        <span className={cn("col-start-1 row-start-1 inline-flex items-center gap-1 transition-opacity duration-300", hired ? "opacity-100" : "opacity-0")}>
                          <Check className="size-3.5" strokeWidth={3} />Hired
                        </span>
                      </span>
                      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-10"
                        style={{
                          opacity: pointing ? 1 : 0, transform: pointing ? "translate(0, 0)" : "translate(36px, 28px)",
                          transition: pointing ? "opacity .3s ease, transform 1s cubic-bezier(.22,1,.36,1)" : "opacity .35s ease, transform 0s .35s",
                        }}>
                        <MousePointer2 className={cn("size-5 fill-white text-zinc-800 drop-shadow-sm", clicking && "snip-press")} strokeWidth={1.75} />
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {/* Where the hire stands, filling in as the story moves on (green once someone's hired). */}
        <ol className="mt-4 grid grid-cols-4 gap-1.5 border-t border-zinc-100 pt-3">
          {HIRE_STAGES.map((label, i) => (
            <li key={label} className="flex min-w-0 flex-col gap-1.5">
              <span className={cn("h-1 rounded-full transition-colors duration-700", i <= stage ? (hired ? "bg-[#16a34a]" : "bg-brand") : "bg-zinc-200")} />
              <span className={cn("truncate text-[0.6875rem] transition-colors duration-700", i === stage ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- money: in, held, out

// 0 ready · 1 the money leaves Nubo Labs · 2 Folio holds it · 3 it travels on to Lucía · 4 paid
const MONEY_MS = [1400, 1500, 2400, 1500, 3400];
const CURVE = "cubic-bezier(.65,0,.35,1)";
// The three people sit in equal columns, so their centres are at exactly 1/6, 1/2 and 5/6 of the row.
const AT = [100 / 6, 50, 500 / 6];

/** Something that appears, then travels: it fades in where it is and only then moves; when it hides, it fades
 *  first and jumps back only once it's invisible. */
const travel = (on: boolean, prop: "left" | "transform"): React.CSSProperties => ({
  opacity: on ? 1 : 0,
  transition: on ? `opacity .25s ease, ${prop} 1.1s ${CURVE} .2s` : `opacity .4s ease, ${prop} 0s .4s`,
});

export function EscrowSnippet({ total, price, fee }: { total: number; price: number; fee: number }) {
  const { ref, beat } = useBeats(MONEY_MS);
  const held = beat === 2, paid = beat >= 4;
  const coinOn = beat === 1 || beat === 3; // only while travelling: held, it's inside the escrow
  const coinAt = beat <= 0 ? AT[0] : beat <= 2 ? AT[1] : AT[2];
  const track = (on: boolean, from: number, color: string) => (
    <span aria-hidden className={cn("absolute top-6 h-0.5 w-1/3 origin-left -translate-y-1/2", color)}
      style={{ left: `${from}%`, transform: `scaleX(${on ? 1 : 0})`, ...travel(on, "transform") }} />
  );
  const badge = (on: boolean, cls: string, icon: React.ReactNode) => (
    <span aria-hidden className={cn("absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full text-white ring-2 ring-white transition-[opacity,scale] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]", cls, on ? "scale-100 opacity-100" : "scale-50 opacity-0")}>{icon}</span>
  );
  return (
    <div ref={ref} className={frame}>
      <div className={cn(panel, "px-2 py-6 sm:px-4")}>
        <div className="relative grid grid-cols-3">
          {/* The path the money takes; each leg fills in behind the € as it travels. */}
          <span aria-hidden className="absolute inset-x-[16.667%] top-6 -translate-y-1/2 border-t-[1.5px] border-dashed border-zinc-300" />
          {track(beat >= 1, AT[0], "bg-brand")}
          {track(beat >= 3, AT[1], "bg-[#16a34a]")}
          <span aria-hidden className={cn("absolute top-6 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[0.6875rem] font-semibold leading-none text-white shadow-sm tabular-nums", beat >= 3 ? "bg-[#16a34a]" : "bg-brand")}
            style={{ left: `${coinAt}%`, ...travel(coinOn, "left") }}>
            €{beat >= 3 ? price : total}
          </span>

          <div className="relative z-[1] flex flex-col items-center gap-1.5 text-center">
            <NuboMark className="size-12 rounded-xl shadow-sm" />
            <span className="text-xs font-semibold">Nubo Labs</span>
            <span className="text-xs tabular-nums text-muted-foreground">pays €{total}</span>
          </div>

          <div className="relative z-[1] flex flex-col items-center gap-1.5 text-center">
            <span className="relative grid size-12 place-items-center rounded-full border bg-white shadow-sm">
              {/* The glow while the money is held: always pulsing, only its wrapper fades, so it never snaps off. */}
              <span aria-hidden className={cn("absolute -inset-1 rounded-full border-2 border-brand transition-opacity duration-500", held ? "opacity-100" : "opacity-0")}>
                <span className="snip-hold absolute inset-0 rounded-full" />
              </span>
              <Logo size={34} animated={false} />
              {badge(held, "bg-brand", <Lock className="size-3" strokeWidth={2.5} />)}
            </span>
            <span className="text-xs font-semibold">Folio escrow</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {held ? <Swap k="held" className="font-semibold text-brand">€{total} held</Swap> : beat >= 3 ? <Swap k="fee">€{fee} fee</Swap> : <Swap k="ready">holds it safe</Swap>}
            </span>
          </div>

          <div className="relative z-[1] flex flex-col items-center gap-1.5 text-center">
            <span className="relative">
              <Face look={LUCIA} className="size-12 shadow-sm" />
              {badge(paid, "bg-[#16a34a]", <Check className="size-3" strokeWidth={3} />)}
            </span>
            <span className="text-xs font-semibold">Lucía F.</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {paid ? <Swap k="paid" className="font-semibold text-[#15803d]">+€{price}</Swap> : <Swap k="wait">after approval</Swap>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- students: the signed credential

// 0 the project is done · 1 the review and rating · 2 Nubo Labs signs · 3 Lucía signs · 4 verified
const CRED_MS = [1300, 1600, 1300, 1300, 3600];

export function CredentialSnippet() {
  const { ref, beat } = useBeats(CRED_MS);
  const verified = beat >= 4;
  const signer = (on: boolean, who: React.ReactNode, name: string) => (
    <span className={cn(move, shown(on), "inline-flex items-center gap-1.5 rounded-full border bg-white py-0.5 pl-0.5 pr-2.5 text-xs text-muted-foreground")}>
      {who}Signed by {name}<Check className="size-3 text-[#16a34a]" strokeWidth={3} />
    </span>
  );
  return (
    <div ref={ref} className={frame}>
      <div className={cn(panel, move, "flex flex-col gap-3 p-5", verified ? "border-[#86efac]" : "")}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"><Award className="size-4" />Credential</span>
          {verified
            ? <Swap k="verified" className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#15803d]"><BadgeCheck className="size-3.5" />Verified</Swap>
            : <Swap k="pending" className="rounded-full bg-panel px-2 py-0.5 text-xs text-muted-foreground">Awaiting signatures</Swap>}
        </div>
        <div className="flex items-center gap-3">
          <Face look={LUCIA} className="size-10" />
          <div className="min-w-0">
            <p className="text-base font-semibold leading-snug">Market research for Nubo Labs</p>
            <p className="text-sm text-muted-foreground">Lucía Fernández · €600 · 3 weeks</p>
          </div>
        </div>
        <div className={cn(move, shown(beat >= 1), "rounded-lg bg-panel px-3 py-2")}>
          <span className="flex gap-px text-[#d97706]">
            {[0, 1, 2, 3, 4].map((n) => (
              <Star key={n} className={cn("size-3.5 fill-current", beat >= 1 && "snip-pop")} style={{ animationDelay: `${250 + n * 90}ms` }} />
            ))}
          </span>
          <p className="mt-1 text-sm italic text-zinc-600">“Clear, well-sourced and on time.”</p>
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {signer(beat >= 2, <NuboMark className="size-5 rounded-full" />, "Nubo Labs")}
          {signer(beat >= 3, <Face look={LUCIA} className="size-5" />, "Lucía")}
        </div>
      </div>
    </div>
  );
}
