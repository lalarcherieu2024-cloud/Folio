import { ArrowRight, BadgeCheck, Building2, Check, Clock, FileCheck2, Lock, ShieldCheck, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { card } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import type { Organization } from "@/lib/data/startup";
import { detailsComplete } from "@/lib/org";
import { cn } from "@/lib/utils";

// Shown on "Post a project" until the company is verified: the one hurdle before posting, so it sells the check
// (what you get, how little it takes) and shows exactly where you are, instead of just blocking the page.

// Stage 1 of verification (migration 0030); documents only come later, before the first payment.
const STEPS = [
  { icon: Building2, title: "Company details", sub: "Legal name, CIF, website", time: "1 min" },
  { icon: UserCheck, title: "Your LinkedIn and submit", sub: "So we know who's behind the company", time: "1 min" },
  { icon: FileCheck2, title: "Folio review", sub: "Checked against public records", time: "1–2 business days" },
] as const;

const PERKS = [
  { icon: BadgeCheck, title: "A verified badge", sub: "On your profile and every project you post." },
  { icon: Users, title: "Students apply with confidence", sub: "They only ever see projects from checked companies." },
  { icon: Lock, title: "Payments held safely", sub: "You pay into escrow; it's released when you approve the work." },
] as const;

export function VerifyGate({ org }: { org: Organization | null }) {
  const pending = org?.status === "pending";
  // How far it's got: details complete, then submitted (pending); the review is the last step.
  const done = [detailsComplete(org), pending, false];
  const next = done.findIndex((d) => !d);
  const started = !!org && !pending;

  return (
    <div className="flex flex-col gap-5">
      <div className={cn(card, "overflow-hidden")}>
        {/* Navy header, like the sign-up panel: the promise and the one button. */}
        <div className="relative flex flex-col gap-4 overflow-hidden bg-brand-navy px-7 py-8 text-white">
          <ShieldCheck aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-44 text-white/[0.06]" strokeWidth={1.25} />
          <span className="grid size-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"><ShieldCheck className="size-5" /></span>
          <div className="flex max-w-[34rem] flex-col gap-2">
            <h2 className="text-balance text-[1.625rem] font-semibold leading-tight tracking-[-0.02em]">
              {pending ? "You're in the queue. Almost ready to post." : started ? "You're part-way there. Pick up where you left off." : "A two-minute check, then you're posting."}
            </h2>
            <p className="text-pretty text-[0.9375rem] leading-relaxed text-brand-low">
              {pending
                ? "Folio is checking your documents, usually within 1–2 business days. We'll let you know the moment you can publish."
                : "Every company on Folio is checked once, so students know the work and the pay are real. It takes about 2 minutes: your company details and your LinkedIn. No documents until your first payment."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/company/verify" className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 bg-white px-5 text-[0.9375rem] text-brand-navy hover:bg-brand-halo")}>
              {pending ? "See status" : started ? "Continue verification" : "Start verification"}<ArrowRight className="size-4" />
            </Link>
            {!pending && <span className="flex items-center gap-1.5 text-[0.8125rem] text-brand-low"><Clock className="size-3.5" />About 2 minutes</span>}
          </div>
        </div>

        {/* Where you are: three short steps, with the next one marked. */}
        <ol className="grid divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((s, i) => {
            const isDone = done[i], isNext = i === next && !pending;
            const Icon = s.icon;
            return (
              <li key={s.title} className={cn("flex items-start gap-3 px-5 py-4", isNext && "bg-soft/50")}>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", isDone ? "bg-[#22c55e] text-white" : isNext ? "bg-brand text-white" : "bg-panel text-muted-foreground")}>
                  {isDone ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{s.title}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{s.sub}</span>
                  <span className={cn("mt-1 text-xs font-medium", isDone ? "text-[#15803d]" : isNext ? "text-brand" : "text-muted-foreground")}>{isDone ? "Done" : isNext ? `Next · ${s.time}` : s.time}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Why it's worth the five minutes. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PERKS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className={cn(card, "flex flex-col gap-2 p-4")}>
              <span className="grid size-8 place-items-center rounded-lg bg-soft text-brand"><Icon className="size-4" /></span>
              <span className="text-sm font-semibold">{p.title}</span>
              <span className="text-[0.8125rem] leading-snug text-muted-foreground">{p.sub}</span>
            </div>
          );
        })}
      </div>

      {!pending && <p className="text-[0.8125rem] text-muted-foreground">Have your CIF and website to hand. Before your first payment we&apos;ll also ask for a registry extract (nota simple) from the last 3 months and the representative&apos;s ID.</p>}
    </div>
  );
}
