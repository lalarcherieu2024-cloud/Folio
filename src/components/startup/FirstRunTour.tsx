"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Step-by-step coaching for a company: one tip at a time, for the step it's on now. It dims the page and spotlights
// the element marked data-tour="…": verification first, then (once verified) posting the first project, then (once
// students apply) the applicants. Each tip is shown once per browser and account (localStorage, a per-viewer
// convenience), so finishing a step brings up the next tip on a later visit.

export type TourStage = "verify" | "post" | "applicants";

const TIPS: Record<TourStage, { title: string; body: string; action: { label: string; href: string } }> = {
  verify: { title: "Start here: get verified", body: "Every company is checked once before students see its projects. It takes about 2 minutes, and no documents are needed yet.", action: { label: "Start verification", href: "/company/verify" } },
  post: { title: "You're verified. Post your first project", body: "Describe the work, set a fixed price and a clear finish line. IE students apply within days.", action: { label: "Post a project", href: "/company/projects/new" } },
  applicants: { title: "Students have applied", body: "Each applicant comes with their CV, skills and a short pitch. Accept one and the project starts.", action: { label: "See applicants", href: "/company/applicants" } },
};

const PAD = 8;

export function FirstRunTour({ userId, stage }: { userId: string; stage: TourStage }) {
  const key = `folio_tip_${stage}_${userId}`;
  const tip = TIPS[stage];
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Show it once, after the page has faded in, if there's something on screen to point at.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(key) === "1"; } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-tour="${stage}"]`);
      if (el && el.getClientRects().length > 0) setOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, [key, stage]);

  const close = useCallback(() => {
    try { localStorage.setItem(key, "1"); } catch {}
    setOpen(false);
  }, [key]);

  // Follow the highlighted element as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!open) return;
    const el = document.querySelector(`[data-tour="${stage}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const t = setInterval(update, 250); // catches the smooth scroll and late layout shifts
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); clearInterval(t); };
  }, [open, stage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !rect) return null;
  const vw = document.documentElement.clientWidth;
  // Below the highlight unless there's no room; lined up with whichever edge of the element is nearer the middle,
  // and never wider than the screen.
  const below = rect.bottom + 230 < window.innerHeight;
  const side = rect.left + rect.width / 2 > vw / 2 ? { right: Math.max(16, vw - rect.right) } : { left: Math.max(16, rect.left) };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* The spotlight: a transparent box over the element, with the rest of the page darkened by its shadow. */}
      <div aria-hidden onClick={close} className="absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute rounded-xl ring-2 ring-white transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, boxShadow: "0 0 0 9999px rgba(8,47,73,.62)" }} />
      <div className="absolute flex w-[21.25rem] max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl bg-white p-5 shadow-2xl"
        style={{ ...side, ...(below ? { top: rect.bottom + PAD + 12 } : { top: Math.max(16, rect.top - PAD - 12), transform: "translateY(-100%)" }) }}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-brand">Next step</span>
          <button type="button" onClick={close} aria-label="Close" className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-panel hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 id="tour-title" className="text-base font-semibold tracking-tight">{tip.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{tip.body}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={close} className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-3")}>Later</button>
          <Link href={tip.action.href} onClick={close} className={cn(buttonVariants(), "h-8 gap-1.5 px-3")}>{tip.action.label}<ArrowRight className="size-3.5" /></Link>
        </div>
      </div>
    </div>
  );
}
