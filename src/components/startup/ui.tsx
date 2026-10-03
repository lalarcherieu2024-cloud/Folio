// Small visual building blocks for the startup interface (colours from the design handoff).
import type { Category, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const HUES = {
  blue: { solid: "#2f5bd3", bg: "#e6ecfb", fg: "#1b2f86" },
  coral: { solid: "#e8613c", bg: "#fdeae4", fg: "#9a3412" },
  green: { solid: "#22a55a", bg: "#e3f5ea", fg: "#166534" },
  amber: { solid: "#e0a00f", bg: "#fdf3d8", fg: "#92400e" },
  violet: { solid: "#7c4dde", bg: "#efe8fd", fg: "#5b21b6" },
} as const;
export type Hue = (typeof HUES)[keyof typeof HUES];

const CATEGORY_HUE: Record<Category, keyof typeof HUES> = {
  "Tech & Data": "blue",
  "Design & Creative": "coral",
  "Marketing & Growth": "green",
  "Business & Finance": "blue",
  "Research & Analysis": "violet",
  "Writing & Content": "amber",
  "Video & Photo": "coral",
  "Operations & Admin": "blue",
};
export const hueFor = (c: Category): Hue => HUES[CATEGORY_HUE[c] ?? "blue"];

const AVATAR_HUES = [HUES.coral, HUES.blue, HUES.violet, HUES.green, HUES.amber];
/** Stable colour per person, so the same student always gets the same avatar tint. */
export const avatarHue = (id: string): Hue => AVATAR_HUES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_HUES.length];

const STATUS: Record<ProjectStatus, [label: string, bg: string, fg: string]> = {
  open: ["Open", "#f0fdf4", "#166534"],
  in_progress: ["In progress", "#d9e3fb", "#1b2f86"],
  delivered: ["Delivered", "#fdf3d8", "#92400e"],
  verified: ["Completed", "#f4f4f5", "#3f3f46"],
  cancelled: ["Cancelled", "#fef2f2", "#b91c1c"],
};

export function StatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  const [label, bg, fg] = STATUS[status];
  return <span className={cn("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium", className)} style={{ background: bg, color: fg }}>{label}</span>;
}

export function Pill({ hue, children, className }: { hue: Hue; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium", className)} style={{ background: hue.bg, color: hue.fg }}>{children}</span>;
}

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
/** "2 hours ago", "yesterday", "3 weeks ago"; falls back to the month for anything older than ~2 months. */
export function ago(iso: string) {
  const sec = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 9]];
  let v = sec;
  for (const [unit, size] of steps) {
    if (Math.abs(v) < size) return RTF.format(Math.round(v), unit);
    v /= size;
  }
  return new Date(iso).toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export const pastLabel = (count: number, avg: number | null) => (count ? `${count} past project${count > 1 ? "s" : ""} · ★ ${avg?.toFixed(1)}` : "First project");
