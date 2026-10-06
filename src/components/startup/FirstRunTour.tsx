"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A first-visit walkthrough for a new company: dims the page and spotlights, one at a time, the elements marked with
// data-tour="…". It starts on verification, the step that unlocks everything else. Seen once per browser and
// account (localStorage, a per-viewer convenience); steps whose element isn't on screen (e.g. a collapsed sidebar
// on a phone) are skipped.

type Step = { target: string; title: string; body: string };

const STEPS: Step[] = [
  { target: "verify", title: "Start here: get verified", body: "Every company is checked once before students see its projects. It takes about 5 minutes, and you can save and come back any time." },
  { target: "post", title: "Then post your first project", body: "Describe the work, set a fixed price and a clear finish line. IE students apply within days." },
  { target: "applicants", title: "Pick who does the work", body: "Applicants show up here with their CV, skills and a short pitch. Accept one and the project starts." },
];

const PAD = 8;

export function FirstRunTour({ userId }: { userId: string }) {
  const key = `folio_tour_company_${userId}`;
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Decide once, after mount, whether to show it and which steps have something to point at.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(key) === "1"; } catch {}
    if (seen) return;
    const visible = STEPS.filter((s) => {
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      return el && el.getClientRects().length > 0;
    });
    const t = setTimeout(() => setSteps(visible), 600); // after the page has faded in
    return () => clearTimeout(t);
  }, [key]);

  const close = useCallback(() => {
    try { localStorage.setItem(key, "1"); } catch {}
    setSteps([]);
  }, [key]);

  const step = steps[i];

  // Follow the highlighted element as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const t = setInterval(update, 250); // catches the smooth scroll and late layout shifts
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); clearInterval(t); };
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, close]);

  if (!step || !rect) return null;
  const last = i === steps.length - 1;
  // The card goes below the highlight, or above it when there's no room underneath.
  const below = rect.bottom + 220 < window.innerHeight;
  const left = Math.min(Math.max(16, rect.left), window.innerWidth - 16 - 340);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* The spotlight: a transparent box over the element, with the rest of the page darkened by its shadow. */}
      <div aria-hidden onClick={close} className="absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute rounded-xl ring-2 ring-white transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, boxShadow: "0 0 0 9999px rgba(8,47,73,.62)" }} />
      <div className="absolute flex w-[min(21.25rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl bg-white p-5 shadow-2xl transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={below ? { top: rect.bottom + PAD + 12, left } : { top: Math.max(16, rect.top - PAD - 12), left, transform: "translateY(-100%)" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand">Welcome to Folio · {i + 1} of {steps.length}</span>
          <button type="button" onClick={close} aria-label="Close the tour" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-panel hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 id="tour-title" className="text-base font-semibold tracking-tight">{step.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex flex-1 gap-1">{steps.map((s, n) => <span key={s.target} className={cn("h-1.5 rounded-full transition-all", n === i ? "w-5 bg-brand" : "w-1.5 bg-zinc-200")} />)}</span>
          {i > 0 && <button type="button" onClick={() => setI(i - 1)} className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3")}>Back</button>}
          {last
            ? <Link href="/company/verify" onClick={close} className={cn(buttonVariants(), "h-8 gap-1.5 px-3")}>Start verification<ArrowRight className="size-3.5" /></Link>
            : <button type="button" onClick={() => setI(i + 1)} className={cn(buttonVariants(), "h-8 gap-1.5 px-3")}>Next<ArrowRight className="size-3.5" /></button>}
        </div>
      </div>
    </div>
  );
}
