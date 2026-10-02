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
