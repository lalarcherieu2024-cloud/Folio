"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleSavedAction } from "@/app/actions/student";
import { cn } from "@/lib/utils";

// The heart on a project card. The card itself is a link, so the click must not follow it.
export function SaveButton({ projectId, initial }: { projectId: string; initial: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [, start] = useTransition();
  return (
    <button
      type="button" aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save project"}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        const next = !saved; setSaved(next);
        start(async () => { const r = await toggleSavedAction(projectId, next); if (r.error) { setSaved(!next); toast.error(r.error); } else toast(next ? "Saved to your shortlist" : "Removed from saved"); });
      }}
      className="grid size-7 shrink-0 place-items-center rounded-md text-zinc-400 hover:bg-muted hover:text-zinc-700"
    >
      <Heart className={cn("size-4", saved && "fill-[#e11d48] text-[#e11d48]")} />
    </button>
  );
}
