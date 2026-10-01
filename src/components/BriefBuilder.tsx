"use client";

import { useActionState, useState } from "react";
import { postProjectAction, type FormState } from "@/app/actions";
import { CATEGORIES } from "@/lib/types";
import type { Brief } from "@/lib/brief";
import { Field, FormError } from "./Field";

const FEE = 0.15;
const blank = { title: "", category: CATEGORIES[0] as string, summary: "", deliverables: "", doneWhen: "", skills: "", weeks: 2, priceEur: 300 };

export function BriefBuilder() {
  const [idea, setIdea] = useState("");
  const [f, setF] = useState(blank);
  const [questions, setQuestions] = useState<string[]>([]);
  const [source, setSource] = useState<Brief["source"] | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string>();
  const [state, action, pending] = useActionState<FormState, FormData>(postProjectAction, {});
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function draft() {
    setDrafting(true); setDraftError(undefined);
    try {
      const res = await fetch("/api/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idea }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't draft the brief.");
      const b = data as Brief;
      setF({ title: b.title, category: b.category, summary: b.summary, deliverables: b.deliverables.join("\n"), doneWhen: b.doneWhen, skills: b.skills.join(", "), weeks: b.weeks, priceEur: b.priceEur });
      setQuestions(b.openQuestions); setSource(b.source);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Couldn't draft the brief.");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-2xl border-2 border-blue bg-blue-soft p-6 lg:sticky lg:top-24">
        <h2 className="text-xl">1 · Describe your idea</h2>
        <p className="mb-3 mt-1 text-sm text-muted">Rough is fine. What are you building or trying to get done, and who is it for?</p>
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={6} maxLength={2000} aria-label="Your idea" className="input"
          placeholder="e.g. I'm starting a thrift-fashion Instagram shop and I need a simple brand: a logo, colours, and some post templates." />
        <FormError msg={draftError} />
        <button type="button" onClick={draft} disabled={drafting || idea.trim().length < 15} className="btn mt-3">
          {drafting ? "Drafting your brief…" : "✨ Draft my brief with AI"}
        </button>
        {source === "template" && <p className="mt-3 rounded-lg bg-amber-soft p-3 text-sm text-amber-ink">AI isn&apos;t connected yet (no <code>ANTHROPIC_API_KEY</code>), so this is a generic starting template. Edit it by hand.</p>}
        {questions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-bold">Before you post, decide:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{questions.map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
        )}
      </section>

      <form action={action} className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-1 text-xl">2 · Review and post</h2>
        <p className="mb-5 text-sm text-muted">Edit anything. A good brief has deliverables a student can tick off.</p>
        <Field label="Project title" htmlFor="title"><input id="title" name="title" value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={70} className="input" /></Field>
        <Field label="Category" htmlFor="category">
          <select id="category" name="category" value={f.category} onChange={(e) => set("category", e.target.value)} className="input">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="What's the problem or goal?" htmlFor="summary"><textarea id="summary" name="summary" value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={2} className="input" /></Field>
        <Field label="Deliverables" htmlFor="deliverables" hint="One per line. Each should be something you can see or open.">
          <textarea id="deliverables" name="deliverables" value={f.deliverables} onChange={(e) => set("deliverables", e.target.value)} rows={5} className="input" />
        </Field>
        <Field label="How will you know it's done?" htmlFor="doneWhen" hint="A test you can check on the last day."><textarea id="doneWhen" name="doneWhen" value={f.doneWhen} onChange={(e) => set("doneWhen", e.target.value)} rows={2} className="input" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price paid to student (€)" htmlFor="priceEur"><input id="priceEur" name="priceEur" type="number" min={150} step={50} value={f.priceEur} onChange={(e) => set("priceEur", Number(e.target.value))} className="input" /></Field>
          <Field label="Duration" htmlFor="weeks">
            <select id="weeks" name="weeks" value={f.weeks} onChange={(e) => set("weeks", Number(e.target.value))} className="input">{[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>{w} week{w > 1 ? "s" : ""}</option>)}</select>
          </Field>
        </div>
        <Field label="Skills needed" htmlFor="skills" hint="Separate with commas."><input id="skills" name="skills" value={f.skills} onChange={(e) => set("skills", e.target.value)} className="input" /></Field>
        <p className="mb-4 rounded-lg bg-bg p-3 text-sm">You pay <b>€{Math.round(f.priceEur * (1 + FEE)).toLocaleString("en-GB")}</b> in total: €{f.priceEur.toLocaleString("en-GB")} to the student plus a 15% Folio fee. Payments go live in a later phase.</p>
        <FormError msg={state.error} />
        <button disabled={pending} className="btn w-full">{pending ? "Posting…" : "Post request"}</button>
      </form>
    </div>
  );
}
