"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FormState } from "@/lib/form";
import { postProjectAction } from "@/app/actions/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Brief } from "@/lib/brief";
import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";

const FEE = 0.15;
const EXAMPLE = "I'm starting a thrift-fashion Instagram shop and I need a simple brand: a logo, colours, and some post templates.";
const blank = { title: "", category: CATEGORIES[0] as string, summary: "", deliverables: "", doneWhen: "", skills: "", weeks: 2, priceEur: 300 };

const Num = ({ n }: { n: number }) => <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n}</span>;
const card = "flex flex-col rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]";
const select = "h-9 w-full rounded-md border bg-white px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BriefBuilder() {
  const [idea, setIdea] = useState("");
  const [f, setF] = useState(blank);
  const [questions, setQuestions] = useState<string[]>([]);
  const [drafted, setDrafted] = useState<Brief["source"] | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(postProjectAction, {});
  const seen = useRef(state);
  useEffect(() => { if (state !== seen.current) { seen.current = state; if (state.error) toast.error(state.error); } }, [state]);
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function draft() {
    setDrafting(true);
    try {
      const res = await fetch("/api/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idea }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't draft the brief.");
      const b = data as Brief;
      setF({ title: b.title, category: b.category, summary: b.summary, deliverables: b.deliverables.join("\n"), doneWhen: b.doneWhen, skills: b.skills.join(", "), weeks: b.weeks, priceEur: b.priceEur });
      setQuestions(b.openQuestions); setDrafted(b.source);
      if (b.source === "template") toast("AI isn't connected yet", { description: "This is a generic starting template. Edit it by hand." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't draft the brief.");
    } finally {
      setDrafting(false);
    }
  }

  const ideaOk = idea.trim().length >= 15;
  const ready = !!(f.title.trim() && f.summary.trim() && f.deliverables.trim() && f.doneWhen.trim() && f.priceEur >= 150);
  const total = Math.round(f.priceEur * (1 + FEE));

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,23.75rem),1fr))] items-start gap-4">
      <section className={cn(card, "bg-panel")}>
        <div className="flex items-center gap-2.5 p-5 pb-3"><Num n={1} /><h2 className="text-base font-semibold">Describe your idea</h2></div>
        <div className={cn("flex flex-col gap-3 px-5 pb-5 transition-opacity", drafting && "opacity-40")}>
          <p className="text-[0.8125rem] text-muted-foreground">Rough is fine. What are you building or trying to get done, and who is it for?</p>
          <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={6} maxLength={2000} aria-label="Your idea" placeholder="e.g. a logo and brand colours for my Instagram shop…" className="resize-none bg-white" />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={draft} disabled={drafting || !ideaOk} className="h-9 px-3.5"><Sparkles className="size-4" />{drafting ? "Drafting your brief…" : drafted ? "Redraft with AI" : "Draft my brief with AI"}</Button>
            {!ideaOk && <span className="text-xs text-muted-foreground">At least 15 characters</span>}
            {!idea && <button type="button" onClick={() => setIdea(EXAMPLE)} className="text-xs font-medium text-zinc-600 underline underline-offset-4 hover:text-foreground">Use an example</button>}
          </div>
          {questions.length > 0 && (
            <div className="rounded-lg border bg-white p-3.5">
              <p className="text-sm font-semibold">Before you post, decide</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[0.8125rem] text-muted-foreground">{questions.map((q) => <li key={q}>{q}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      <form action={action} className={card}>
        <div className="flex items-center gap-2.5 p-5 pb-3"><Num n={2} /><h2 className="text-base font-semibold">Review and post</h2>{drafted === "ai" && <Badge variant="secondary" className="ml-auto h-[1.375rem] rounded-md px-2 text-xs">AI draft · edit anything</Badge>}</div>
        <div className="grid gap-4 px-5 pb-5">
          <div className="grid gap-1.5"><Label htmlFor="title">Project title</Label><Input id="title" name="title" value={f.title} maxLength={70} onChange={(e) => set("title", e.target.value)} className="h-9" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="category">Field</Label><select id="category" name="category" value={f.category} onChange={(e) => set("category", e.target.value)} className={select}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="grid gap-1.5"><Label htmlFor="skills">Skills</Label><Input id="skills" name="skills" value={f.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Comma separated" className="h-9" /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="summary">Problem or goal</Label><Textarea id="summary" name="summary" value={f.summary} rows={2} onChange={(e) => set("summary", e.target.value)} className="resize-none" /></div>
          <div className="grid gap-1.5"><Label htmlFor="deliverables">Deliverables</Label><Textarea id="deliverables" name="deliverables" value={f.deliverables} rows={4} onChange={(e) => set("deliverables", e.target.value)} className="resize-none" /><span className="text-xs text-muted-foreground">One per line. Each should be something you can see or open.</span></div>
          <div className="grid gap-1.5"><Label htmlFor="doneWhen">Done when</Label><Textarea id="doneWhen" name="doneWhen" value={f.doneWhen} rows={2} onChange={(e) => set("doneWhen", e.target.value)} className="resize-none" /><span className="text-xs text-muted-foreground">A test you can check on the last day.</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="priceEur">Price paid to student (€)</Label><Input id="priceEur" name="priceEur" type="number" min={150} step={50} value={f.priceEur} onChange={(e) => set("priceEur", Number(e.target.value))} className="h-9 font-mono" /></div>
            <div className="grid gap-1.5"><Label htmlFor="weeks">Duration</Label><select id="weeks" name="weeks" value={f.weeks} onChange={(e) => set("weeks", Number(e.target.value))} className={select}>{[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>{w} week{w > 1 ? "s" : ""}</option>)}</select></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t bg-panel px-5 py-4">
          <div className="flex flex-col leading-tight"><span className="text-sm">You pay <span className="font-mono font-semibold">€{total.toLocaleString("en-GB")}</span></span><span className="text-xs text-muted-foreground">€{f.priceEur.toLocaleString("en-GB")} to the student + 15% Folio fee</span></div>
          <Button type="submit" disabled={!ready || pending} className="h-9 px-3.5">{pending ? "Posting…" : "Post request"}</Button>
        </div>
      </form>
    </div>
  );
}
