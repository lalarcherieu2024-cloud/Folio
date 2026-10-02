"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateProjectAction } from "@/app/actions/student";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form";
import { CATEGORIES, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const select = "h-9 w-full rounded-md border bg-white px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EditRequestForm({ project, applicants }: { project: Project; applicants: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProjectAction.bind(null, project.id), {});
  const seen = useRef(state);
  useEffect(() => { if (state !== seen.current) { seen.current = state; if (state.error) toast.error(state.error); } }, [state]);

  return (
    <form action={action} className="flex max-w-3xl flex-col rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="grid gap-4 p-5">
        <div className="grid gap-1.5"><Label htmlFor="title">Project title</Label><Input id="title" name="title" defaultValue={project.title} maxLength={70} className="h-9" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label htmlFor="category">Field</Label><select id="category" name="category" defaultValue={project.category} className={select}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="grid gap-1.5"><Label htmlFor="skills">Skills</Label><Input id="skills" name="skills" defaultValue={project.skills.join(", ")} placeholder="Comma separated" className="h-9" /></div>
        </div>
        <div className="grid gap-1.5"><Label htmlFor="summary">Problem or goal</Label><Textarea id="summary" name="summary" defaultValue={project.summary} rows={3} className="resize-none" /></div>
        <div className="grid gap-1.5"><Label htmlFor="deliverables">Deliverables</Label><Textarea id="deliverables" name="deliverables" defaultValue={project.deliverables.join("\n")} rows={5} className="resize-none" /><span className="text-xs text-muted-foreground">One per line.</span></div>
        <div className="grid gap-1.5"><Label htmlFor="doneWhen">Done when</Label><Textarea id="doneWhen" name="doneWhen" defaultValue={project.doneWhen} rows={2} className="resize-none" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label htmlFor="priceEur">Price paid to student (€)</Label><Input id="priceEur" name="priceEur" type="number" min={150} step={50} defaultValue={project.priceEur} className="h-9 font-mono" /></div>
          <div className="grid gap-1.5"><Label htmlFor="weeks">Duration</Label><select id="weeks" name="weeks" defaultValue={project.weeks} className={select}>{[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>{w} week{w > 1 ? "s" : ""}</option>)}</select></div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t bg-panel px-5 py-4">
        <span className="text-[0.8125rem] text-muted-foreground">
          {applicants > 0 ? `${applicants} applicant${applicants === 1 ? "" : "s"} will be notified if you change anything.` : "No one has applied yet, so nobody needs to be told."}
        </span>
        <div className="flex gap-2">
          <Link href={`/requests/${project.id}`} className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3.5")}>Cancel</Link>
          <Button type="submit" disabled={pending} className="h-9 px-3.5">{pending ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </form>
  );
}
