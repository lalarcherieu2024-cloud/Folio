// The "post a project" form as a company left it. Shared by the wizard (browser) and the server.
import { CATEGORIES, type Category } from "./types";

export type DraftData = { title: string; category: Category | ""; summary: string; deliverable: string; skills: string[]; pay: string; weeks: number };
export const EMPTY_DRAFT: DraftData = { title: "", category: "", summary: "", deliverable: "", skills: [], pay: "", weeks: 0 };

/** Whatever came in, as a safe, bounded draft. Every field may be empty. */
export function cleanDraft(raw: unknown): DraftData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const category = CATEGORIES.includes(r.category as Category) ? (r.category as Category) : "";
  const weeks = Number(r.weeks);
  return {
    title: text(r.title, 70), category, summary: text(r.summary, 4000), deliverable: text(r.deliverable, 2000),
    skills: Array.isArray(r.skills) ? r.skills.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 40)).slice(0, 12) : [],
    pay: text(r.pay, 6).replace(/[^0-9]/g, ""), weeks: Number.isInteger(weeks) && weeks >= 1 && weeks <= 6 ? weeks : 0,
  };
}

/** How far through the 4 steps a draft is (the first step that still needs something). */
export function draftStep(d: DraftData): number {
  if (!(d.title.trim() && d.category && d.summary.trim())) return 1;
  if (!(d.deliverable.trim() && d.skills.length)) return 2;
  if (!(Number(d.pay) >= 150 && d.weeks)) return 3;
  return 4;
}
