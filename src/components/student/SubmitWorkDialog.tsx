"use client";

import { Plus, Send, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitWorkAction } from "@/app/actions/submissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtKb, MAX_SUBMISSION_FILES, MAX_SUBMISSION_MB, safeName } from "@/lib/files";
import { createClient } from "@/lib/supabase/client";

/** "Submit project": the student sends the files the client asked for. They go straight to private storage. */
export function SubmitWorkDialog({ applicationId, userId, title, deliverables, doneWhen, feedback, round, className }: {
  applicationId: string; userId: string; title: string; deliverables: string[]; doneWhen: string;
  feedback?: string | null; round: number; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [busy, start] = useTransition();
  const [progress, setProgress] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const resubmit = round > 0;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const tooBig = picked.find((f) => f.size > MAX_SUBMISSION_MB * 1024 * 1024);
    if (tooBig) { toast.error(`${tooBig.name} is over ${MAX_SUBMISSION_MB} MB.`); return; }
    const next = [...files, ...picked].slice(0, MAX_SUBMISSION_FILES);
    if (files.length + picked.length > MAX_SUBMISSION_FILES) toast.error(`Up to ${MAX_SUBMISSION_FILES} files per submission.`);
    setFiles(next);
  }

  function send() {
    start(async () => {
      const supabase = createClient();
      const uploaded: { path: string; name: string; sizeKb: number }[] = [];
      for (const [i, f] of files.entries()) {
        setProgress(`Uploading ${i + 1} of ${files.length}…`);
        const path = `${userId}/${applicationId}/${Date.now()}-${i}-${safeName(f.name)}`;
        const { error } = await supabase.storage.from("submissions").upload(path, f, { contentType: f.type || "application/octet-stream" });
        if (error) {
          if (uploaded.length) await supabase.storage.from("submissions").remove(uploaded.map((u) => u.path));
          setProgress("");
          toast.error(/bucket not found/i.test(error.message) ? "Submissions aren't set up yet. Run migration 0019 in Supabase." : `Couldn't upload ${f.name}.`);
          return;
        }
        uploaded.push({ path, name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) });
      }
      setProgress("Sending…");
      const r = await submitWorkAction(applicationId, note, uploaded);
      setProgress("");
      if (r.error) {
        await supabase.storage.from("submissions").remove(uploaded.map((u) => u.path));
        toast.error(r.error);
        return;
      }
      toast.success(resubmit ? "Resubmitted" : "Project submitted", { description: "The client has been notified and will review it." });
      setOpen(false); setFiles([]); setNote("");
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <DialogTrigger render={<Button size="sm" className={className ?? "h-8 gap-1.5 px-3 text-[0.8125rem]"} />}><Send className="size-3.5" />{resubmit ? "Resubmit" : "Submit project"}</DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[34rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{resubmit ? "Resubmit" : "Submit"} “{title}”</DialogTitle>
          <DialogDescription>Send the documents the client asked for. They review them in Folio and either approve or send feedback.</DialogDescription>
        </DialogHeader>
        {feedback && (
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 text-sm text-[#92400e]"><b className="font-semibold">Feedback from the client</b><p className="mt-1 whitespace-pre-wrap">{feedback}</p></div>
        )}
        <div className="rounded-lg bg-panel p-3 text-sm">
          <b className="font-semibold">They asked for</b>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-zinc-700">{deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
          {doneWhen && <p className="mt-2 text-muted-foreground">Done when: {doneWhen}</p>}
        </div>
        <div className="grid gap-2">
          <Label>Files <span className="font-normal text-muted-foreground">(any type, up to {MAX_SUBMISSION_FILES} files, {MAX_SUBMISSION_MB} MB each)</span></Label>
          <input ref={input} type="file" multiple className="sr-only" onChange={pick} />
          {files.length > 0 && (
            <ul className="grid gap-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border bg-panel px-2.5 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{f.name}</span><span className="text-xs text-muted-foreground">{fmtKb(Math.max(1, Math.round(f.size / 1024)))}</span>
                  <button type="button" disabled={busy} aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
          {files.length < MAX_SUBMISSION_FILES && (
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium hover:bg-panel"><Plus className="size-4 text-muted-foreground" />{files.length ? "Add another file" : "Choose files"}</button>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="submit-note">Note for the client <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea id="submit-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} rows={3} placeholder="Anything they should know before opening the files." className="resize-none" />
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={busy || files.length === 0} onClick={send}>{busy ? progress || "Working…" : resubmit ? "Resubmit work" : "Submit work"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
