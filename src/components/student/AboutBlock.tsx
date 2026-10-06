import { ExternalLink, Globe } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

// Who is behind a project: the company (with its details).
export function AboutBlock({ p }: { p: Project }) {
  const name = p.orgName ?? p.clientName;
  const meta = p.about ? [p.about.industry, p.about.size, p.about.founded && `Founded ${p.about.founded}`].filter(Boolean).join(" · ") : "Company";
  const blurb = p.about?.blurb;
  const linkedin = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`;
  const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[0.8125rem] font-medium hover:bg-muted";
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-panel p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">{name[0]}</span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold">About {name}</span>
          <span className="text-xs text-muted-foreground">{meta}</span>
          <span className="text-xs text-muted-foreground">Madrid · {p.hood}</span>
        </div>
      </div>
      {blurb && <p className="text-pretty text-sm leading-relaxed text-zinc-700">{blurb}</p>}
      <div className="flex flex-wrap gap-2">
        {p.about?.website && <a href={p.about.website} target="_blank" rel="noopener noreferrer" className={btn}><Globe className="size-3.5" />Website</a>}
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className={cn(btn, "text-[#0a66c2]")}><ExternalLink className="size-3.5" />LinkedIn</a>
      </div>
    </section>
  );
}
