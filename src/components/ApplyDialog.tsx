"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { applyAction, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { firstName } from "@/lib/work";

const MIN = 40, MAX = 600;

export function ApplyDialog({ projectId, client }: { projectId: string; client: string }) {
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(applyAction, {});
  const handled = useRef<FormState>(state);

  useEffect(() => {
    if (state === handled.current || !state.ok) return;
    handled.current = state;
    setOpen(false);
    toast.success("Application sent", { description: `${firstName(client)} usually replies within 3 days.` });
  }, [state, client]);

  const len = pitch.trim().length;
  const ready = len >= MIN;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="h-10 w-full justify-start px-4 text-sm" />}>Apply with a short pitch</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Apply to {client}</DialogTitle>
          <DialogDescription>Tell them why you&apos;re a good fit. Mention a class, project or job that&apos;s relevant. Your CV is sent with it.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <Textarea name="pitch" value={pitch} onChange={(e) => setPitch(e.target.value.slice(0, MAX))} rows={6} aria-label="Your pitch" placeholder="I built a similar dashboard for…" className="resize-none" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{ready ? "Looks good" : "Aim for 2–4 sentences"}</span>
            <span className="font-mono">{pitch.length}/{MAX}</span>
          </div>
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <DialogFooter className="mt-1 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!ready || pending}>{pending ? "Sending…" : "Send application"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
