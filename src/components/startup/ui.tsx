// Small building blocks for the startup interface, in the same style as the student side.
import { FIELD_TONES } from "@/lib/fields";
import type { Category, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const card = "rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]";
export const chip = "inline-flex h-[1.375rem] items-center gap-1 rounded-md px-2 text-xs font-medium";

// Same tones as the student "request" page.
export const TONES = {
  success: "bg-[#dcfce7] text-[#166534]",
  info: "bg-[#e0f2fe] text-[#0c4a6e]",
  warning: "bg-[#fef3c7] text-[#92400e]",
  violet: "bg-[#ede9fe] text-[#5b21b6]",
  danger: "bg-[#fee2e2] text-[#991b1b]",
  muted: "bg-zinc-100 text-zinc-600",
} as const;

const STATUS: Record<ProjectStatus, [label: string, tone: keyof typeof TONES]> = {
  draft: ["Awaiting payment", "warning"],
  open: ["Open", "success"],
  in_progress: ["In progress", "info"],
  delivered: ["Delivered", "violet"],
  verified: ["Verified", "success"],
  cancelled: ["Cancelled", "muted"],
};

export function StatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  const [label, tone] = STATUS[status];
  return <span className={cn(chip, TONES[tone], className)}>{label}</span>;
}

/** Page title + one-line description, as on every student page. */
export function PageHeader({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">{title}</h1>
        {sub && <p className="max-w-[64ch] text-[0.9375rem] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
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

/** A project's field as a soft coloured chip, the same colours students see in the project filters. */
export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  const tone = FIELD_TONES[category] ?? { bg: "#f1f5f9", fg: "#334155" };
  return <span className={cn("inline-flex h-5 w-fit items-center rounded px-1.5 text-xs font-medium", className)} style={{ background: tone.bg, color: tone.fg }}>{category}</span>;
}
