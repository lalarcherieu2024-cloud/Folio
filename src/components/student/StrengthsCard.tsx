"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { analyzeCvAction } from "@/app/actions/student";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Strengths } from "@/lib/types";

const color = (pct: number) => (pct >= 75 ? "#2f5bd3" : pct >= 50 ? "#7d99e6" : "#c7d4f5");
const PLACEHOLDER: Strengths = {
  fields: ["Tech & Data", "Business & Finance", "Research & Analysis", "Operations & Admin", "Marketing & Growth", "Design & Creative"].map((label, i) => ({ label, pct: 85 - i * 12 })),
  skills: ["SQL", "Excel", "Python", "Data viz", "Writing", "Research"].map((label, i) => ({ label, pct: 80 - i * 10 })),
};

export function StrengthsCard({ strengths, hasCv, cvIsPdf }: { strengths: Strengths | null; hasCv: boolean; cvIsPdf: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"fields" | "skills">("fields");
  const [shown, setShown] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 50); return () => clearTimeout(t); }, []);

  async function score() {
    setStatus("running"); setError("");
    const res = await analyzeCvAction();
    if (res.error) { setStatus("error"); setError(res.error); } else { setStatus("idle"); router.refresh(); }
  }
  // A CV that is already uploaded but not scored yet gets scored automatically, once.
  useEffect(() => {
    if (hasCv && cvIsPdf && !strengths && !started.current) { started.current = true; void score(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCv, cvIsPdf, strengths]);

  const locked = !hasCv;
  const covered = locked || !strengths; // placeholder bars are shown blurred under a small prompt
  const data = strengths ?? PLACEHOLDER;
  const rows = data[tab];
  const subtitle = locked ? "Upload your CV to see how you score in every field." : strengths ? "Scored from your CV and verified credentials." : status === "running" ? "Reading your CV…" : "We couldn't score your CV yet.";

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">Where you&apos;re strong</span>
          <span className="text-[0.8125rem] text-muted-foreground">{subtitle}</span>
        </div>
        <div className="inline-flex gap-0.5 rounded-lg bg-muted p-[0.1875rem]" role="tablist">
          {(["fields", "skills"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-7 rounded-md px-3 text-[0.8125rem] font-medium capitalize", tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>{t}</button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(min(100%,18.75rem),1fr))] gap-x-10 gap-y-3.5 transition-[filter] duration-300", covered && "pointer-events-none select-none blur-[0.3125rem]", status === "running" && "animate-pulse")} aria-hidden={covered}>
          {rows.map((g, i) => {
            const cell = (
              <>
                <span className="truncate text-sm text-zinc-800">{g.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: shown ? `${g.pct}%` : 0, background: color(g.pct), transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 60}ms` }} /></div>
                <span className="text-right font-mono text-[0.8125rem] font-medium">{g.pct}%</span>
              </>
            );
            const cls = "-mx-1.5 grid grid-cols-[9.375rem_minmax(0,1fr)_2.75rem] items-center gap-3 rounded-md px-1.5 py-1 hover:bg-panel";
            return tab === "fields" && !locked ? <Link key={g.label} href={`/projects?category=${encodeURIComponent(g.label)}`} className={cls}>{cell}</Link> : <div key={g.label} className={cls}>{cell}</div>;
          })}
        </div>
        {covered && (
          <div className="absolute inset-0 flex items-center px-2">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-md">
              {status === "running" ? (
                <span className="text-[0.8125rem] font-medium">Reading your CV… a few seconds</span>
              ) : locked ? (
                <>
                  <span className="text-[0.8125rem]"><b className="font-semibold">See your strengths.</b> <span className="text-muted-foreground">Upload your CV.</span></span>
                  <Link href="/profile" className={cn(buttonVariants({ size: "sm" }), "h-7 px-3 text-xs")}>Upload CV</Link>
                </>
              ) : !cvIsPdf ? (
                <>
                  <span className="text-[0.8125rem]"><b className="font-semibold">Word files can&apos;t be scored.</b> <span className="text-muted-foreground">Upload a PDF.</span></span>
                  <Link href="/profile" className={cn(buttonVariants({ size: "sm" }), "h-7 px-3 text-xs")}>Replace CV</Link>
                </>
              ) : (
                <>
                  <span className="text-[0.8125rem] text-muted-foreground">{error || "Couldn't score your CV."}</span>
                  <button type="button" onClick={score} className={cn(buttonVariants({ size: "sm" }), "h-7 px-3 text-xs")}>Try again</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
