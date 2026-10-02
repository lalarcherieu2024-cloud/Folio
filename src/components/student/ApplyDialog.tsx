"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { applyAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form";
import { firstName } from "@/lib/work";

const MAX = 600;

export function ApplyDialog({ projectId, client, cvName, fileCount }: { projectId: string; client: string; cvName: string; fileCount: number }) {
  const [open, setOpen] = useState(false);
  const [cv, setCv] = useState(false);
  const [files, setFiles] = useState(false);
  const [note, setNote] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(applyAction, {});
  const handled = useRef<FormState>(state);

  useEffect(() => {
    if (state === handled.current || !state.ok) return;
    handled.current = state;
    setOpen(false);
    toast.success("Application sent", { description: `${firstName(client)} usually replies within 3 days.` });
  }, [state, client]);

  const box = "mt-0.5 size-4 shrink-0 accent-[#18181b]";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="h-10 w-full justify-start px-4 text-sm" />}>Apply to this project</DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[30rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Apply to {client}</DialogTitle>
          <DialogDescription>Choose what to send with your application.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="projectId" value={projectId} />

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-panel">
            <input type="checkbox" name="includeCv" checked={cv} onChange={(e) => setCv(e.target.checked)} className={box} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">Send my CV <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-zinc-600">Required</span></span>
              <span className="truncate text-xs text-muted-foreground">{cvName}</span>
            </span>
          </label>

          <label className={`flex items-start gap-3 rounded-lg border p-3 ${fileCount ? "cursor-pointer hover:bg-panel" : "bg-panel"}`}>
            <input type="checkbox" name="includeFiles" checked={files && fileCount > 0} disabled={!fileCount} onChange={(e) => setFiles(e.target.checked)} className={box} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">Also share my additional files <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-zinc-600">Optional</span></span>
              <span className="text-xs text-muted-foreground">
                {fileCount ? `${fileCount} file${fileCount === 1 ? "" : "s"}: portfolio and extra work` : <>No additional files yet. <Link href="/profile" className="font-medium underline underline-offset-4">Add some in your profile</Link>.</>}
              </span>
            </span>
          </label>

          <div className="grid gap-1.5">
            <label htmlFor="note" className="flex items-center gap-2 text-sm font-medium">Short note <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-zinc-600">Optional</span></label>
            <Textarea id="note" name="pitch" value={note} onChange={(e) => setNote(e.target.value.slice(0, MAX))} rows={4} placeholder="Why you're a good fit: a class, project or job that's relevant." className="resize-none" />
            <div className="text-right font-mono text-xs text-muted-foreground">{note.length}/{MAX}</div>
          </div>

          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!cv || pending}>{pending ? "Sending…" : "Send application"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
