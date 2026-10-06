"use client";

import { Check, Clock, MessageSquare, PenLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProjectDraftAction } from "@/app/actions/startup";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPANY_STEPS, nextStep, toneClass, type BoardRow } from "@/lib/company-work";
import type { ProjectDraft } from "@/lib/data/startup";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";

const outline = cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 bg-white px-3 text-[0.8125rem]");
const primary = cn(buttonVariants({ size: "sm" }), "h-8 px-3 text-[0.8125rem]");

// The one thing to do now, as the main button. Mirrors "Submit project" on the student's card.
function MainAction({ r }: { r: BoardRow }) {
  if (r.stage.key === "draft") return <Link href={`/company/projects/${r.project.id}/pay`} className={primary}>Pay to publish</Link>;
  if (r.stage.key === "open" && r.waiting) return <Link href={`/company/applicants?project=${r.project.id}`} className={primary}>Review applicants</Link>;
  if (r.stage.key === "submitted" && r.hired) return <Link href={`/company/applicants/${r.hired.id}`} className={primary}>Review the work</Link>;
  return null;
}

/** One project, laid out like an application card on the student's "My work". */
function ProjectRowCard({ r }: { r: BoardRow }) {
  const [ring, fg] = r.stage.colors;
  const p = r.project;
  const posted = new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const tinted = r.stage.key === "submitted" || (r.stage.key === "open" && r.waiting > 0);
  return (
    <div className="flex flex-col gap-[1.125rem] rounded-xl border bg-white p-5" style={{ boxShadow: `inset 3px 0 0 ${ring}` }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base font-semibold">{p.title}</span>
            <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", toneClass(r.stage.tone))}>{r.stage.label}</span>
          </div>
          <span className="text-[0.8125rem] text-muted-foreground">{p.category} · {eur(p.priceEur)} · {weeksLabel(p.weeks)} · posted {posted}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/company/projects/${p.id}`} className={outline}>View project</Link>
          {p.applicantCount > 0 && <Link href={`/company/applicants?project=${p.id}`} className={outline}>Applicants · {p.applicantCount}</Link>}
          {r.hired && r.stage.key !== "verified" && <Link href={`/company/messages?c=${r.hired.id}`} className={cn(outline, "gap-1.5")}><MessageSquare className="size-3.5" />Messages</Link>}
          <MainAction r={r} />
        </div>
      </div>

      {r.hired && (
        <Link href={`/company/applicants/${r.hired.id}`} className="flex w-fit items-center gap-2 text-[0.8125rem] text-zinc-700 hover:underline">
          <UserAvatar name={r.hired.name} color={r.hired.avatarColor} url={r.hired.avatarUrl} className="size-6 rounded-md text-[0.625rem]" />
          <span>{r.stage.key === "verified" ? "Done by" : "Hired"} <span className="font-medium text-foreground">{r.hired.name}</span></span>
        </Link>
      )}

      {r.due && (
        <p className={cn("inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.8125rem] font-medium", r.due.tone === "late" ? "bg-[#fee2e2] text-[#991b1b]" : r.due.tone === "soon" ? "bg-[#fef3c7] text-[#92400e]" : "bg-muted text-zinc-700")}><Clock className="size-3.5" />{r.due.label}</p>
      )}

      {r.stage.step >= 0 && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COMPANY_STEPS.length}, minmax(0, 1fr))` }}>
          {COMPANY_STEPS.map((label, i) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="h-1.5 rounded-full" style={{ background: i <= r.stage.step ? ring : "#dde7ee", boxShadow: i === r.stage.step ? `0 0 0 3px ${ring}22` : "none" }} />
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: i <= r.stage.step ? fg : "#94a3b8", fontWeight: i === r.stage.step ? 600 : 500 }}>
                {i < r.stage.step && <Check className="size-[0.6875rem]" strokeWidth={3} />}{label}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className={cn("rounded-lg px-3.5 py-3 text-[0.8125rem]", tinted ? "bg-[#fffbeb] text-[#92400e]" : "bg-panel text-zinc-600")}>{nextStep(r, false)}</p>
    </div>
  );
}

const DRAFT_STEPS = ["Basics", "Deliverable & skills", "Pay & duration", "Review"];

/** A project the company started but didn't finish: pick it up again, or throw it away. */
function UnfinishedCard({ d }: { d: ProjectDraft }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const saved = new Date(d.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const remove = () => start(async () => {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    await deleteProjectDraftAction(d.id);
    toast.success("Draft deleted");
    router.refresh();
  });
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-dashed border-zinc-300 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cn("text-base font-semibold", !d.data.title && "text-muted-foreground")}>{d.data.title || "Untitled project"}</span>
            <span className="inline-flex h-[1.375rem] items-center rounded-md bg-zinc-100 px-2 text-xs font-medium text-zinc-600">Unfinished</span>
          </div>
          <span className="text-[0.8125rem] text-muted-foreground">{[d.data.category, d.data.pay && `€${Number(d.data.pay).toLocaleString("en-GB")}`, `saved ${saved}`].filter(Boolean).join(" · ")}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={remove} className={cn(outline, "gap-1.5 text-destructive hover:bg-red-50 hover:text-destructive")}><Trash2 className="size-3.5" />Delete</button>
          <Link href={`/company/projects/new?draft=${d.id}`} className={cn(primary, "gap-1.5")}><PenLine className="size-3.5" />Continue editing</Link>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${DRAFT_STEPS.length}, minmax(0, 1fr))` }}>
        {DRAFT_STEPS.map((label, i) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="h-1.5 rounded-full" style={{ background: i < d.step ? "#94a3b8" : "#e5e9ee" }} />
            <span className="text-xs" style={{ color: i < d.step ? "#475569" : "#94a3b8", fontWeight: i === d.step - 1 ? 600 : 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2"><h2 className="text-sm font-semibold">{title}</h2><span className="text-[0.8125rem] text-muted-foreground">{sub}</span></div>
      {children}
    </section>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
      <span className="text-base font-semibold">{title}</span>
      <span className="text-muted-foreground">{body}</span>
      {cta && <Link href="/company/projects/new" className={cn(buttonVariants(), "h-9 px-3.5")}>Post a project</Link>}
    </div>
  );
}

export function CompanyWorkTabs({ rows, unfinished, tab }: { rows: BoardRow[]; unfinished: ProjectDraft[]; tab: "active" | "drafts" | "past" }) {
  const active = rows.filter((r) => ["open", "building", "submitted"].includes(r.stage.key));
  const drafts = rows.filter((r) => r.stage.key === "draft");
  const past = rows.filter((r) => r.stage.key === "verified" || r.stage.key === "cancelled");
  return (
    <Tabs defaultValue={tab} className="gap-5">
      <TabsList className="h-9 self-start">
        <TabsTrigger value="active" className="px-3 text-[0.8125rem]">Active · {active.length}</TabsTrigger>
        <TabsTrigger value="drafts" className="px-3 text-[0.8125rem]">Drafts · {drafts.length + unfinished.length}</TabsTrigger>
        <TabsTrigger value="past" className="px-3 text-[0.8125rem]">Past · {past.length}</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="flex flex-col gap-3">
        {active.length === 0 ? <Empty title={rows.length ? "Nothing active right now" : "Nothing posted yet"} body={rows.length ? "Unpaid projects are under Drafts and finished ones under Past." : "Describe the work, set a fixed price, and IE students apply."} cta /> : active.map((r) => <ProjectRowCard key={r.project.id} r={r} />)}
      </TabsContent>
      <TabsContent value="drafts" className="flex flex-col gap-6">
        {drafts.length + unfinished.length === 0 ? (
          <Empty title="No drafts" body="Start a project and save it as a draft to finish later. Finished projects wait here until you pay to publish them." cta />
        ) : <>
          {drafts.length > 0 && (
            <Section title="Ready to publish" sub="One step left: pay, and students can start applying.">
              {drafts.map((r) => <ProjectRowCard key={r.project.id} r={r} />)}
            </Section>
          )}
          {unfinished.length > 0 && (
            <Section title="Unfinished" sub="You’re part of the way there. Pick up where you left off and publish when it’s ready.">
              {unfinished.map((d) => <UnfinishedCard key={d.id} d={d} />)}
            </Section>
          )}
        </>}
      </TabsContent>
      <TabsContent value="past" className="flex flex-col gap-3">
        {past.length === 0 ? <Empty title="No past projects yet" body="Verified and cancelled projects end up here." /> : past.map((r) => <ProjectRowCard key={r.project.id} r={r} />)}
      </TabsContent>
    </Tabs>
  );
}
