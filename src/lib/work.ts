import type { Application, Project } from "./types";

export const eur = (n: number) => "€" + n.toLocaleString("en-GB");
export const weeksLabel = (n: number) => `${n} week${n > 1 ? "s" : ""}`;
export const firstName = (name: string) => name.split(" ")[0];

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

export function profileChecklist(user: { uniEmailVerified: boolean; cv: unknown }, applications: number, credentials: number) {
  const items = [
    { label: "University email verified", done: user.uniEmailVerified },
    { label: "CV uploaded", done: !!user.cv },
    { label: "First application sent", done: applications > 0 },
    { label: "First verified credential", done: credentials > 0 },
  ];
  return { items, pct: Math.round((items.filter((i) => i.done).length / items.length) * 100) };
}
