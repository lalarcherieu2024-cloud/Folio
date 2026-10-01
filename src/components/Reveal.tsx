"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Fades/slides its children in the first time they scroll into view. Content is visible
// by default (no-JS safe) and only hidden after mount if it starts below the fold.
export function Reveal({ children, className = "", delay = 0, from = "up" }: { children: ReactNode; className?: string; delay?: number; from?: "up" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top > window.innerHeight * 0.92) setState("hidden");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState((s) => (s === "hidden" ? "shown" : s)); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dir = from === "left" ? "from-left" : from === "right" ? "from-right" : "";
  return (
    <div ref={ref} style={{ "--d": `${delay}ms` } as React.CSSProperties} className={`reveal ${state === "hidden" ? `reveal-hidden ${dir}` : ""} ${className}`}>
      {children}
    </div>
  );
}
