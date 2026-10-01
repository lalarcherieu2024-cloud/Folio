"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Strengths } from "@/lib/types";

const color = (pct: number) => (pct >= 75 ? "#2f5bd3" : pct >= 50 ? "#7d99e6" : "#c7d4f5");
const PLACEHOLDER: Strengths = {
  fields: ["Tech & Data", "Business & Finance", "Research & Analysis", "Operations & Admin", "Marketing & Growth", "Design & Creative"].map((label, i) => ({ label, pct: 85 - i * 12 })),
  skills: ["SQL", "Excel", "Python", "Data viz", "Writing", "Research"].map((label, i) => ({ label, pct: 80 - i * 10 })),
};

export function StrengthsCard({ strengths, hasCv }: { strengths: Strengths | null; hasCv: boolean }) {
  const [tab, setTab] = useState<"fields" | "skills">("fields");
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 50); return () => clearTimeout(t); }, []);

  const locked = !hasCv;
  const unreadable = hasCv && !strengths;
  const data = strengths ?? PLACEHOLDER;
  const rows = data[tab];
  const top = data.fields[0];

  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">Where you&apos;re strong</span>
          <span className="text-[13px] text-muted-foreground">{locked ? "Upload your CV to see how you score in every field." : unreadable ? "We couldn't read your CV yet." : "Scored from your CV and verified credentials."}</span>
        </div>
        <div className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]" role="tablist">
          {(["fields", "skills"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-7 rounded-md px-3 text-[13px] font-medium capitalize", tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>{t}</button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-10 gap-y-3.5 transition-[filter] duration-300", (locked || unreadable) && "pointer-events-none select-none blur-[5px]")} aria-hidden={locked || unreadable}>
          {rows.map((g, i) => {
            const cell = (
              <>
                <span className="truncate text-sm text-zinc-800">{g.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: shown ? `${g.pct}%` : 0, background: color(g.pct), transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 60}ms` }} /></div>
                <span className="text-right font-mono text-[13px] font-medium">{g.pct}%</span>
              </>
            );
            const cls = "-mx-1.5 grid grid-cols-[150px_minmax(0,1fr)_44px] items-center gap-3 rounded-md px-1.5 py-1 hover:bg-panel";
            return tab === "fields" && !locked ? <Link key={g.label} href={`/projects?category=${encodeURIComponent(g.label)}`} className={cls}>{cell}</Link> : <div key={g.label} className={cls}>{cell}</div>;
          })}
        </div>
        {(locked || unreadable) && (
          <div className="absolute inset-0 flex items-center px-2">
            <div className="flex flex-wrap items-center gap-3.5 rounded-[10px] border bg-white px-4 py-3.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,.15)]">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{locked ? "See your strengths" : "Upload a PDF to see them"}</span>
                <span className="text-[13px] text-muted-foreground">{locked ? "We read your CV and score you across every field." : "We can score PDF CVs. Word files are stored but not scored."}</span>
              </div>
              <Link href="/profile" className={cn(buttonVariants(), "h-[34px] px-3.5 text-[13px]")}>{locked ? "Upload CV" : "Replace CV"}</Link>
            </div>
          </div>
        )}
      </div>

      {strengths && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3.5 text-[13px] text-muted-foreground">
          <span>Strongest in {top.label} ({top.pct}%).</span>
          <Link href={`/projects?category=${encodeURIComponent(top.label)}`} className={cn(buttonVariants({ variant: "outline" }), "h-8 px-3 text-[13px]")}>See {top.label} projects</Link>
        </div>
      )}
    </div>
  );
}
