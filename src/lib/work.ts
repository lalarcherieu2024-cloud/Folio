import type { Application, Project } from "./types";

export const eur = (n: number) => "€" + n.toLocaleString("en-GB");
export const weeksLabel = (n: number) => `${n} week${n > 1 ? "s" : ""}`;
export const firstName = (name: string) => name.split(" ")[0];
export const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export const STEPS = ["Applied", "Accepted", "Building", "Delivered", "Verified"] as const;

// Where an application sits on the 5-step tracker, plus its badge.
export function statusInfo(a: Pick<Application, "status">, p: Pick<Project, "status">) {
  if (a.status === "declined") return { step: -1, label: "Not selected", tone: "muted" as const };
  if (p.status === "verified" && (a.status === "accepted" || a.status === "delivered")) return { step: 4, label: "Verified", tone: "success" as const };
  if (a.status === "delivered") return { step: 3, label: "Awaiting verification", tone: "muted" as const };
  if (a.status === "accepted") return { step: 2, label: "In progress", tone: "info" as const };
  return { step: 0, label: "Waiting for client", tone: "warning" as const };
}

export const TONE_CLASS = {
  warning: "bg-[#fef3c7] text-[#92400e]",
  info: "bg-[#dbeafe] text-[#1e40af]",
  success: "bg-[#dcfce7] text-[#166534]",
  muted: "bg-secondary text-secondary-foreground",
} as const;

// Colour + progress for each stage of the tracker: [ring, text, row tint].
export const STAGE_COLORS: Record<number, [string, string, string]> = {
  0: ["#f59e0b", "#b45309", "#fffdf7"],
  2: ["#3b82f6", "#1d4ed8", "#fafcff"],
  3: ["#8b5cf6", "#6d28d9", "#fcfbff"],
  4: ["#22c55e", "#15803d", "#f9fefb"],
};
export const stageColors = (step: number) => STAGE_COLORS[step] ?? ["#a1a1aa", "#52525b", "#ffffff"];
export const stagePct = (step: number) => Math.round(((step + 1) / STEPS.length) * 100);
export const nextLabel = (step: number) => (step >= STEPS.length - 1 ? "Complete" : `Next: ${STEPS[step + 1]}`);

type ChecklistUser = {
  cv: unknown; linkedinVerified: boolean; linkedinUrl: string | null; githubVerified: boolean; githubHandle: string | null;
  payoutLink: string | null; fileCount: number; strengths: { fields: { label: string }[] } | null;
};

// "Complete your profile": things that make a client say yes. The third item depends on the field:
// tech -> GitHub, anything else -> a portfolio / extra files, unknown yet -> either one.
export function profileChecklist(user: ChecklistUser) {
  const hasGithub = user.githubVerified; // only a connected (verified) account counts
  const hasFiles = user.fileCount > 0;
  const top = user.strengths?.fields[0]?.label;
  const proof = !top ? { label: "Connect your GitHub or upload a portfolio", done: hasGithub || hasFiles }
    : top === "Tech & Data" ? { label: "Connect your GitHub", done: hasGithub }
    : { label: "Upload your portfolio (PDF)", done: hasFiles };
  const items = [
    { label: "Add your PayPal payout link", done: !!user.payoutLink },
    { label: "Connect your LinkedIn", done: user.linkedinVerified },
    proof,
    { label: "Upload your CV", done: !!user.cv },
  ];
  return { items, pct: Math.round((items.filter((i) => i.done).length / items.length) * 100) };
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
export function softColor(name: string): { background: string; color: string } {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [background, color] = SOFT[h % SOFT.length];
  return { background, color };
}
