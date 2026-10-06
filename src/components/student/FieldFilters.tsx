"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterItem = { key: string; label: string; count?: number; href: string; active: boolean };

// Sidebar filters with a highlight that glides between choices (spring-like), items that
// slide in one after another, and radio dots that pop. The links stay plain links, so
// the server still does the filtering; this component only adds the motion.
export function FieldFilters({ fields }: { fields: FilterItem[] }) {
  const index = Math.max(0, fields.findIndex((f) => f.active));
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <div className="slide-in px-2 pb-1.5 text-xs font-medium text-muted-foreground">Field</div>
        <div className="relative flex flex-col gap-0.5">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-8 rounded-md bg-muted shadow-[inset_0_0_0_1px_rgba(0,0,0,.04)] transition-transform duration-[450ms] ease-[cubic-bezier(.34,1.35,.64,1)]"
            style={{ transform: `translateY(calc(${index} * 2.125rem))` }}
          />
          {fields.map((f, i) => (
            <Link
              key={f.key} href={f.href} scroll={false} aria-current={f.active ? "true" : undefined}
              style={{ animationDelay: `${60 + i * 35}ms` }}
              className={cn("slide-in group relative z-10 flex h-8 items-center justify-between rounded-md px-2 text-sm transition-[color,transform] duration-200 hover:translate-x-0.5 active:scale-[.98]", f.active ? "font-medium text-foreground" : "text-zinc-600 hover:text-foreground")}
            >
              <span>{f.label}</span>
              <span key={`${f.key}-${f.count}`} className={cn("pop-count font-mono text-xs tabular-nums transition-colors", f.active ? "text-zinc-600" : "text-zinc-400 group-hover:text-zinc-600")}>{f.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
