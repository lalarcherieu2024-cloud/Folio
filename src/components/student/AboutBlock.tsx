import { ExternalLink, Globe } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";

// Who is behind a project: a company (with its details) or a fellow student.
export function AboutBlock({ p }: { p: Project }) {
  const name = p.orgName ?? p.clientName;
  const company = p.clientKind === "company";
  const meta = company ? (p.about ? [p.about.industry, p.about.size, p.about.founded && `Founded ${p.about.founded}`].filter(Boolean).join(" · ") : "Company") : "IE University student";
  const blurb = company ? p.about?.blurb : "Fellow IE student posting their own project. Check their profile before you apply.";
  const linkedin = `https://www.linkedin.com/search/results/${company ? "companies" : "people"}/?keywords=${encodeURIComponent(name)}`;
  const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[0.8125rem] font-medium hover:bg-muted";
  return (
    // id="client": project cards link here from the client's photo and name.
    <section id="client" className="flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-panel p-5">
      <div className="flex items-center gap-3">
        <UserAvatar name={name} url={company ? p.orgLogoUrl : p.clientAvatarUrl} className="size-11 rounded-lg text-base" />
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
