"use client";

import { Check, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";
import type { Project } from "@/lib/types";
import { ApplyDialog } from "@/components/student/ApplyDialog";

export type SheetMode = "apply" | "needs-cv" | "applied" | "own" | "signed-out";

function AboutBlock({ p }: { p: Project }) {
  const name = p.orgName ?? p.clientName;
  const company = p.clientKind === "company";
  const meta = company ? (p.about ? [p.about.industry, p.about.size, p.about.founded && `Founded ${p.about.founded}`].filter(Boolean).join(" · ") : "Company") : "IE University student";
  const blurb = company ? p.about?.blurb : "Fellow IE student posting their own project. Check their profile before you apply.";
  const linkedin = `https://www.linkedin.com/search/results/${company ? "companies" : "people"}/?keywords=${encodeURIComponent(name)}`;
  const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[0.8125rem] font-medium hover:bg-muted";
  return (
    <section className="flex flex-col gap-3 rounded-[0.625rem] border bg-panel p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">{name[0]}</span>
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

export function ProjectSheet({ project, mode, status, mySkills = [], cvName = "", fileCount = 0 }: { project: Project | null; mode: SheetMode; status?: string; mySkills?: string[]; cvName?: string; fileCount?: number }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const close = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("project");
    router.replace(next.size ? `${path}?${next}` : path, { scroll: false });
  };
  const p = project;
  const stats = p ? [["Pay", eur(p.priceEur)], ["Duration", weeksLabel(p.weeks)], ["Applicants", String(p.applicantCount)]] : [];

  return (
    <Sheet open={!!p} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[32.5rem]">
        {p && (
          <>
            <div className="border-b px-6 pb-5 pt-6">
              <div className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                <span className="font-medium text-foreground">{p.orgName ?? p.clientName}</span>
                {p.orgVerified && <Badge variant="outline" className="h-5 gap-1 rounded-md px-1.5 text-[0.6875rem] text-[#166534]"><Check className="size-3" />Verified</Badge>}
                <span>· {p.hood}</span>
              </div>
              <SheetTitle className="mt-2 pr-8 text-xl font-semibold leading-snug tracking-tight">{p.title}</SheetTitle>
              <SheetDescription className="sr-only">Project brief</SheetDescription>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 border-b">
                {stats.map(([k, v], i) => (
                  <div key={k} className={cn("flex flex-col gap-0.5 px-6 py-4", i > 0 && "border-l")}>
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="font-mono text-sm font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-6 px-6 py-6">
                <p className="text-[0.9375rem] leading-relaxed">{p.summary}</p>
                <AboutBlock p={p} />
                <section>
                  <h4 className="mb-2.5 text-sm font-semibold">Deliverables</h4>
                  <ul className="space-y-2">
                    {p.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded border bg-white"><Check className="size-3 text-zinc-400" strokeWidth={3} /></span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-lg border bg-panel p-4">
                  <h4 className="mb-1 text-sm font-semibold">Done when</h4>
                  <p className="text-sm text-muted-foreground">{p.doneWhen}</p>
                </section>
                <section>
                  <h4 className="mb-2.5 text-sm font-semibold">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="rounded-md px-2 text-xs font-medium">{p.category}</Badge>
                    {p.skills.map((s) => {
                      const match = mySkills.includes(s.toLowerCase());
                      return (
                        <Badge key={s} variant="secondary" title={match ? "On your profile" : "Not on your profile yet"} className={cn("gap-1 rounded-md px-2 text-xs font-medium", match ? "border border-[#bbf7d0] bg-[#dcfce7] text-[#166534]" : "text-zinc-800")}>
                          {match && <Check className="size-3" strokeWidth={3} />}{s}
                        </Badge>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
            <div className="border-t bg-panel px-6 py-4">
              {mode === "apply" && <ApplyDialog projectId={p.id} client={p.orgName ?? p.clientName} cvName={cvName} fileCount={fileCount} />}
              {mode === "needs-cv" && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Add your CV to apply. Clients read it with your pitch.</p>
                  <Link href="/profile" className={cn(buttonVariants(), "h-9 shrink-0 px-3.5")}>Upload CV</Link>
                </div>
              )}
              {mode === "applied" && (
                <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3.5 py-2.5 text-sm">
                  <span>You applied · <span className="font-medium">{status}</span></span>
                  <Link href="/applications" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3")}>Track</Link>
                </div>
              )}
              {mode === "own" && <Link href={`/requests/${p.id}`} className={cn(buttonVariants({ size: "lg" }), "h-10 w-full px-4 text-sm")}>Manage applicants</Link>}
              {mode === "signed-out" && <Link href={`/signin?next=${encodeURIComponent(`/projects?project=${p.id}`)}`} className={cn(buttonVariants({ size: "lg" }), "h-10 w-full px-4 text-sm")}>Sign in to apply</Link>}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
