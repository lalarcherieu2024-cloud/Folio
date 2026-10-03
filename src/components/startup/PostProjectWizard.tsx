"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { postCompanyProjectAction } from "@/app/actions/startup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form";
import { CATEGORIES, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";
import { hueFor, Pill } from "./ui";

const SKILLS = ["Figma", "UI design", "Copywriting", "Branding", "Excel", "Market research", "Data analysis", "SQL", "Python", "Content", "Video editing", "Webflow"];
const WEEKS = [1, 2, 3, 4, 6]; // the database allows 1 to 6 weeks
const MIN_PAY = 150; // the database rejects projects under €150
const STEPS = ["Basics", "Deliverable & skills", "Pay & duration", "Review"];
const HINTS = ["Add a title and description", "Describe the deliverable and pick at least one skill", `Set a price of at least €${MIN_PAY} and a duration`, ""];

const blank = { title: "", category: "" as Category | "", summary: "", deliverable: "", skills: [] as string[], custom: "", pay: "", weeks: 0 };
const selectCls = "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("inline-flex h-[30px] items-center rounded-lg border px-3 text-[13px] font-medium transition-colors", on ? "border-brand bg-brand text-white" : "bg-white text-zinc-800 hover:border-zinc-400", className)}>
      {children}
    </button>
  );
}

export function PostProjectWizard({ clientName, hood }: { clientName: string; hood: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [f, setF] = useState(blank);
  const set = (patch: Partial<typeof blank>) => setF((p) => ({ ...p, ...patch }));
  const [state, action, pending] = useActionState<FormState, FormData>(postCompanyProjectAction, {});
  const seen = useRef(state);
  useEffect(() => { if (state !== seen.current) { seen.current = state; if (state.error) toast.error(state.error); } }, [state]);

  const valid = [
    !!(f.title.trim() && f.category && f.summary.trim()),
    !!(f.deliverable.trim() && f.skills.length > 0),
    Number(f.pay) >= MIN_PAY && f.weeks > 0,
    true,
  ][step - 1];
  const toggleSkill = (s: string) => set({ skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s] });
  const addCustom = () => { const v = f.custom.trim(); if (v && !f.skills.includes(v)) set({ skills: [...f.skills, v], custom: "" }); };
  const allSkills = [...SKILLS, ...f.skills.filter((s) => !SKILLS.includes(s))];
  const hue = f.category ? hueFor(f.category) : null;

  return (
    <div className="flex flex-col gap-7">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1, done = n < step, cur = n === step;
          return (
            <li key={label} className="flex-[1_1_140px]">
              <button type="button" disabled={!done} onClick={() => setStep(n)} className={cn("flex w-full items-center gap-2.5 border-t-2 py-2.5 text-left", done || cur ? "border-brand" : "border-border", done && "cursor-pointer")}>
                <span className={cn("grid size-[22px] place-items-center rounded-full font-mono text-[11px] font-semibold", done || cur ? "bg-brand text-white" : "bg-secondary text-muted-foreground")}>{done ? <Check className="size-3" strokeWidth={3} /> : n}</span>
                <span className={cn("text-[13px] font-medium", cur ? "text-foreground" : done ? "text-zinc-700" : "text-zinc-400")}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <form action={action} className="rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]" onSubmit={(e) => { if (step < 4) e.preventDefault(); }}>
        {/* Everything is submitted from the last step; earlier steps only edit local state. */}
        <input type="hidden" name="title" value={f.title} />
        <input type="hidden" name="category" value={f.category} />
        <input type="hidden" name="summary" value={f.summary} />
        <input type="hidden" name="deliverable" value={f.deliverable} />
        {f.skills.map((s) => <input key={s} type="hidden" name="skills" value={s} />)}
        <input type="hidden" name="priceEur" value={f.pay} />
        <input type="hidden" name="weeks" value={f.weeks} />

        <div className="flex flex-col gap-5 p-6">
          {step === 1 && <>
            <div className="grid gap-1.5">
              <Label htmlFor="w-title">Title</Label>
              <Input id="w-title" value={f.title} maxLength={70} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Landing page redesign for our clinic app" className="h-10" />
              <span className="text-xs text-muted-foreground">Say what gets made. Students scan titles first.</span>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="w-category">Category</Label>
              <select id="w-category" value={f.category} onChange={(e) => set({ category: e.target.value as Category })} className={selectCls}>
                <option value="" disabled>Pick the closest field</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="w-summary">Description</Label>
              <Textarea id="w-summary" value={f.summary} rows={6} onChange={(e) => set({ summary: e.target.value })} placeholder="What's the context, who is it for, and what does good look like?" className="resize-y leading-relaxed" />
            </div>
          </>}

          {step === 2 && <>
            <div className="grid gap-1.5">
              <Label htmlFor="w-deliverable">Deliverable</Label>
              <Textarea id="w-deliverable" value={f.deliverable} rows={3} onChange={(e) => set({ deliverable: e.target.value })} placeholder="e.g. Figma file with desktop and mobile landing page" className="resize-y leading-relaxed" />
              <span className="text-xs text-muted-foreground">This is what you&apos;ll check before verifying the work.</span>
            </div>
            <div className="grid gap-2.5">
              <Label>Skills needed</Label>
              <div className="flex flex-wrap gap-2">{allSkills.map((s) => <Chip key={s} on={f.skills.includes(s)} onClick={() => toggleSkill(s)}>{s}</Chip>)}</div>
              <div className="flex gap-2">
                <Input value={f.custom} onChange={(e) => set({ custom: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder="Add another skill" aria-label="Add another skill" className="h-9 max-w-[280px]" />
                <button type="button" onClick={addCustom} className="h-9 rounded-lg border bg-white px-3.5 text-sm font-medium hover:bg-muted">Add</button>
              </div>
            </div>
          </>}

          {step === 3 && <>
            <div className="grid gap-1.5">
              <Label htmlFor="w-pay">How much will you pay?</Label>
              <div className="flex h-10 max-w-[240px] items-center overflow-hidden rounded-lg border focus-within:ring-3 focus-within:ring-ring/50">
                <span className="grid h-full place-items-center border-r bg-panel px-3 font-mono text-muted-foreground">€</span>
                <input id="w-pay" inputMode="numeric" value={f.pay} onChange={(e) => set({ pay: e.target.value.replace(/[^0-9]/g, "") })} placeholder="600" className="h-full min-w-0 flex-1 px-3 font-mono text-sm outline-none" />
              </div>
              <span className="text-xs text-muted-foreground">Fixed price for the whole project, paid when you verify delivery. Minimum €{MIN_PAY}.</span>
            </div>
            <div className="grid gap-2.5">
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2">{WEEKS.map((w) => <Chip key={w} on={f.weeks === w} onClick={() => set({ weeks: w })} className="h-[34px] min-w-[72px] justify-center">{weeksLabel(w)}</Chip>)}</div>
            </div>
          </>}

          {step === 4 && <>
            <span className="text-[13px] text-muted-foreground">Review how students will see it.</span>
            <div className="overflow-hidden rounded-[10px] border">
              <div className="border-b px-5 py-[18px]" style={hue ? { background: hue.bg } : undefined}>
                <div className="text-[13px] text-muted-foreground"><span className="font-medium text-foreground">{clientName}</span> · {hood}</div>
                <div className="mt-1.5 text-[19px] font-semibold tracking-[-0.015em]">{f.title}</div>
              </div>
              <div className="grid grid-cols-2 border-b">
                <div className="px-5 py-3"><div className="text-xs text-muted-foreground">Pay</div><div className="font-mono font-semibold">{eur(Number(f.pay) || 0)}</div></div>
                <div className="border-l px-5 py-3"><div className="text-xs text-muted-foreground">Duration</div><div className="font-mono font-semibold">{f.weeks ? weeksLabel(f.weeks) : "–"}</div></div>
              </div>
              <div className="flex flex-col gap-3.5 px-5 py-[18px]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{f.summary}</p>
                <div><div className="mb-1 text-[13px] font-semibold">Deliverable</div><div className="text-sm">{f.deliverable}</div></div>
                {hue && <div className="flex flex-wrap gap-1.5">{f.skills.map((s) => <Pill key={s} hue={hue}>{s}</Pill>)}</div>}
              </div>
            </div>
          </>}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-b-xl border-t bg-panel px-6 py-3.5">
          <button type="button" onClick={() => (step === 1 ? router.push("/company") : setStep(step - 1))} className="h-9 rounded-lg border bg-white px-3.5 text-sm font-medium hover:bg-muted">{step === 1 ? "Cancel" : "Back"}</button>
          <div className="flex items-center gap-3">
            {!valid && <span className="hidden text-right text-xs text-muted-foreground sm:inline">{HINTS[step - 1]}</span>}
            {step < 4 ? (
              <button type="button" disabled={!valid} onClick={() => { setStep(step + 1); window.scrollTo(0, 0); }} className="h-9 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-opacity hover:bg-brand/90 disabled:opacity-45">Continue</button>
            ) : (
              <button type="submit" disabled={pending} className="h-9 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-45">{pending ? "Publishing…" : "Publish project"}</button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
