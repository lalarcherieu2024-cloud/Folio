import type { LucideIcon } from "lucide-react";

// The "nothing here yet" block, as on the student's My work: a gently animated icon, a short heading, an optional
// line of explanation and the one action that fixes it. Shared so empty spaces look the same on both sides.
export function EmptyState({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 bg-white/60 px-6 py-14 text-center">
      <span className="empty-icon grid size-12 place-items-center rounded-full bg-soft text-brand"><Icon className="size-5" /></span>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xl font-semibold tracking-tight">{title}</span>
        {body && <span className="max-w-[46ch] text-[0.9375rem] text-muted-foreground">{body}</span>}
      </div>
      {children}
    </div>
  );
}
