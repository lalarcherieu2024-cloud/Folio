import { AVATAR_COLORS } from "./avatar";
import type { Application, Project } from "./types";

export const eur = (n: number) => "€" + n.toLocaleString("en-GB");
export const weeksLabel = (n: number) => `${n} week${n > 1 ? "s" : ""}`;
export const firstName = (name: string) => name.split(" ")[0];
export const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// The tracker an application moves through. "Interview" only shows when the client set one up.
const BASE_STEPS = ["Applied", "Accepted", "Building", "Delivered", "Verified"];
const WITH_INTERVIEW = ["Applied", "Interview", "Accepted", "Building", "Delivered", "Verified"];
export const stepsFor = (a: Pick<Application, "interview">) => (a.interview ? WITH_INTERVIEW : BASE_STEPS);

export type Stage = "applied" | "interview" | "building" | "delivered" | "verified" | "declined";
export type Tone = "warning" | "interview" | "info" | "success" | "muted";
export type StatusInfo = { stage: Stage; step: number; steps: string[]; label: string; tone: Tone };

// Where an application sits on its tracker, plus its badge.
export function statusInfo(a: Pick<Application, "status" | "interview">, p: Pick<Project, "status">): StatusInfo {
  const steps = stepsFor(a);
  const at = (stage: Stage, label: string, tone: Tone, step: string): StatusInfo => ({ stage, step: steps.indexOf(step), steps, label, tone });
  if (a.status === "declined") return { stage: "declined", step: -1, steps, label: "Not selected", tone: "muted" };
  if (p.status === "verified" && (a.status === "accepted" || a.status === "delivered")) return at("verified", "Verified", "success", "Verified");
  if (a.status === "delivered") return at("delivered", "Awaiting review", "muted", "Delivered");
  if (a.status === "accepted") return at("building", "In progress", "info", "Building");
  if (a.status === "interview") return at("interview", a.interview?.confirmedAt ? "Interview confirmed" : "Interview invite", "interview", "Interview");
  return at("applied", "Waiting for client", "warning", "Applied");
}

export const TONE_CLASS: Record<Tone, string> = {
  warning: "bg-[#fef3c7] text-[#92400e]",
  interview: "bg-[#cffafe] text-[#155e75]",
  info: "bg-[#e0f2fe] text-[#0c4a6e]",
  success: "bg-[#dcfce7] text-[#166534]",
  muted: "bg-secondary text-secondary-foreground",
};

// Colour for each stage of the tracker: [ring, text, row tint].
export const STAGE_COLORS: Partial<Record<Stage, [string, string, string]>> = {
  applied: ["#f59e0b", "#b45309", "#fffdf7"],
  interview: ["#0891b2", "#155e75", "#f7fdfe"],
  building: ["#0369a1", "#0c4a6e", "#f8fbfd"],
  delivered: ["#8b5cf6", "#6d28d9", "#fcfbff"],
  verified: ["#22c55e", "#166534", "#f9fefb"],
};
export const stageColors = (stage: Stage) => STAGE_COLORS[stage] ?? ["#94a3b8", "#475569", "#ffffff"];
export const stagePct = (s: StatusInfo) => Math.round(((s.step + 1) / s.steps.length) * 100);
export const nextLabel = (s: StatusInfo) => (s.step >= s.steps.length - 1 ? "Complete" : `Next: ${s.steps[s.step + 1]}`);

// "Thu 9 Oct, 17:00", always in Madrid time (the server may run in another timezone).
export const interviewWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
export const isLink = (where: string) => /^(https?:\/\/|[\w-]+\.[\w.-]+\/)/i.test(where.trim());
export const linkHref = (where: string) => (/^https?:\/\//i.test(where) ? where : `https://${where}`);

type ChecklistUser = {
  cv: unknown; linkedinVerified: boolean; payoutLink: string | null; paypalEmail: string | null; fileCount: number; certificateCount: number; strengths: { fields: { label: string }[] } | null;
};

// "Complete your profile": things that make a client say yes. GitHub is optional (it only matters for
// tech work), so it is not on the list. A portfolio is asked for unless your CV shows you work in tech.
// LinkedIn comes first and is marked as the priority: a verified LinkedIn is what makes a client trust a new student.
export function profileChecklist(user: ChecklistUser) {
  const isTech = user.strengths?.fields[0]?.label === "Tech & Data";
  const items = [
    { key: "linkedin", label: "Connect your LinkedIn", done: user.linkedinVerified, priority: true, href: "/profile#accounts" },
    // Courses finished elsewhere (Coursera, Udemy, …): proof of skills before a first Folio project. Optional, so it
    // doesn't count towards the percentage or the steps left.
    { key: "courses", label: "Add your online course certificates", done: user.certificateCount > 0, href: "/profile#courses", optional: true },
    // Payouts go to a PayPal email (set on Payments); a paypal.me link alone can't receive them.
    { key: "payout", label: "Add your PayPal email for payouts", done: !!user.paypalEmail, href: "/payments#payout" },
    ...(isTech ? [] : [{ key: "portfolio", label: "Upload your portfolio (PDF)", done: user.fileCount > 0 }]),
    { key: "cv", label: "Upload your CV", done: !!user.cv },
  ];
  const required = items.filter((i) => !("optional" in i && i.optional));
  return { items, required, pct: Math.round((required.filter((i) => i.done).length / required.length) * 100) };
}

// What we know about the signed-in student, used to personalise project cards.
export type Viewer = { id?: string; skills: string[]; fields: Record<string, number>; saved: string[] }; // skills lowercase

export function viewerFrom(user: { id: string; strengths: { skills: { label: string; pct: number }[]; fields: { label: string; pct: number }[] } | null } | null, saved: string[] = []): Viewer {
  return {
    id: user?.id,
    skills: (user?.strengths?.skills ?? []).filter((s) => s.pct >= 50).map((s) => s.label.toLowerCase()),
    fields: Object.fromEntries((user?.strengths?.fields ?? []).map((f) => [f.label, f.pct])),
    saved,
  };
}

// One honest sentence about why a project suits this student, from their scored CV only.
export function whyFits(p: { skills: string[]; category: string }, v: Viewer): string | null {
  const matched = p.skills.filter((s) => v.skills.includes(s.toLowerCase()));
  if (matched.length) return `You have ${matched.slice(0, 2).join(" and ")}`;
  const pct = v.fields[p.category];
  return pct && pct >= 50 ? `Matches your ${p.category} strength (${pct}%)` : null;
}

// ---- Milestones: come from real verified credentials only.

type Cred = { rating: number; category: string; priceEur: number };

export function milestones(creds: Cred[]) {
  const earned = creds.reduce((n, c) => n + c.priceEur, 0);
  const fields = new Set(creds.map((c) => c.category).filter(Boolean)).size;
  return [
    { key: "first", title: "First project", hint: "Finish and verify one project", done: creds.length >= 1, progress: `${Math.min(creds.length, 1)}/1` },
    { key: "five", title: "First 5★ review", hint: "Get a five-star review from a client", done: creds.some((c) => c.rating === 5), progress: creds.some((c) => c.rating === 5) ? "1/1" : "0/1" },
    { key: "money", title: "€1,000 earned", hint: "Earn €1,000 across verified projects", done: earned >= 1000, progress: `€${Math.min(earned, 1000).toLocaleString("en-GB")} / €1,000` },
    { key: "fields", title: "3 fields covered", hint: "Verified work in three different fields", done: fields >= 3, progress: `${Math.min(fields, 3)}/3` },
  ];
}

// ---- Deadline nudge: the clock starts when the client accepts you and runs for the project's weeks.
export function dueInfo(acceptedAt: string | null, weeks: number, now = new Date()): { label: string; tone: "ok" | "soon" | "late" } | null {
  if (!acceptedAt) return null;
  const due = new Date(acceptedAt); due.setDate(due.getDate() + weeks * 7);
  const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  const when = due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (days < 0) return { label: `Overdue by ${-days} day${days === -1 ? "" : "s"} (was due ${when})`, tone: "late" };
  if (days === 0) return { label: "Hand-in due today", tone: "late" };
  return { label: `Hand-in due in ${days} day${days === 1 ? "" : "s"} (${when})`, tone: days <= 3 ? "soon" : "ok" };
}

// ---- Soft, stable colour for a person's initials (same name, same colour, every time).
const SOFT: [string, string][] = [["#dbeafe", "#1e40af"], ["#dcfce7", "#166534"], ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"], ["#ede9fe", "#5b21b6"], ["#ffedd5", "#9a3412"], ["#cffafe", "#155e75"], ["#fee2e2", "#991b1b"]];
export function softColor(name: string, chosen?: string | null): { background: string; color: string } {
  const pick = chosen ? AVATAR_COLORS.find((c) => c.bg === chosen) : undefined;
  if (pick) return { background: pick.bg, color: pick.fg };
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [background, color] = SOFT[h % SOFT.length];
  return { background, color };
}
