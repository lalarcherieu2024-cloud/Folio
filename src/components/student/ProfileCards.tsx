"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { FormState } from "@/lib/form";
import { deleteCvAction, deleteExtraFileAction, updateProfileAction, uploadCvAction, uploadExtraFileAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileFile, StudentProfile } from "@/lib/types";
import { ConnectAccounts } from "@/components/student/ConnectAccounts";

function DeleteCvButton({ fileName }: { fileName: string }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const remove = () => start(async () => {
    const r = await deleteCvAction();
    if (r.error) toast.error(r.error);
    else { toast.success("CV deleted"); setOpen(false); }
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" aria-label="Delete CV" title="Delete CV" className="grid size-8 place-items-center rounded-md border bg-white text-muted-foreground hover:bg-red-50 hover:text-destructive" />}><Trash2 className="size-4" /></DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[26rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Delete your CV?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{fileName}</span> will be removed.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>You won&apos;t be able to apply to projects until you upload a new CV.</li>
          <li>Your strengths scores, which come from the CV, are cleared.</li>
          <li>Clients reviewing applications you already sent will no longer see it.</li>
        </ul>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Keep it</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete CV"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CvCard({ cv }: { cv: StudentProfile["cv"] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadCvAction, {});
  const form = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("CV saved", { description: "We're scoring it for your strengths." });
    if (state.error) toast.error(state.error);
  }, [state]);

  const input = <input id="cv-file" name="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={() => form.current?.requestSubmit()} />;
  return (
    <form ref={form} action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1"><span className="text-base font-semibold">CV</span><span className="text-[0.8125rem] text-muted-foreground">Required to apply. PDF is scored for your strengths; Word is stored as-is. Up to 5 MB.</span></div>
      {input}
      {cv ? (
        <div className="flex items-center gap-3 rounded-lg border bg-panel p-3">
          <span className="grid size-10 place-items-center rounded-md bg-white text-[0.6875rem] font-semibold ring-1 ring-border">{cv.fileName.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
          <div className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-medium">{cv.fileName}</span><span className="text-xs text-muted-foreground">{cv.sizeKb} KB</span></div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="cv-file" className="inline-flex h-8 cursor-pointer items-center rounded-md border bg-white px-3 text-[0.8125rem] font-medium hover:bg-muted">{pending ? "Uploading…" : "Replace"}</label>
            <DeleteCvButton fileName={cv.fileName} />
          </div>
        </div>
      ) : (
        <label htmlFor="cv-file" className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center hover:bg-panel">
          <Upload className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">{pending ? "Uploading…" : "Click to upload your CV"}</span>
          <span className="text-xs text-muted-foreground">PDF or Word, up to 5 MB</span>
        </label>
      )}
    </form>
  );
}

export function DetailsCard({ user }: { user: StudentProfile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  // Controlled fields: after a save the server sends new values, and uncontrolled inputs
  // (defaultValue) warn when their default changes.
  const [v, setV] = useState({ fullName: user.fullName, program: user.program, payout: user.payoutLink ?? "" });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("Profile saved");
    if (state.error) toast.error(state.error);
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1"><span className="text-base font-semibold">Details and links</span><span className="text-[0.8125rem] text-muted-foreground">Connect LinkedIn to get a verified badge. GitHub is optional, for tech work.</span></div>
      <ConnectAccounts user={user} />
      <div className="grid gap-3">
        <div className="grid gap-1.5"><Label htmlFor="fullName">Name</Label><Input id="fullName" name="fullName" value={v.fullName} onChange={set("fullName")} className="h-9" /></div>
        <div className="grid gap-1.5"><Label htmlFor="program">Programme and year</Label><Input id="program" name="program" value={v.program} onChange={set("program")} className="h-9" /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="payout">PayPal payout link</Label>
          <Input id="payout" name="payout" value={v.payout} onChange={set("payout")} placeholder="https://paypal.me/yourname" className="h-9" />
          <span className="text-xs text-muted-foreground">Where you get paid when a client verifies your work.</span>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="h-9 self-start px-3.5">{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

export function FilesCard({ files }: { files: ProfileFile[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadExtraFileAction, {});
  const [removing, startRemove] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("File added");
    if (state.error) toast.error(state.error);
  }, [state]);
  const full = files.length >= 5;
  return (
    <form ref={form} action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">Additional files <span className="font-normal text-muted-foreground">(optional)</span></span>
        <span className="text-[0.8125rem] text-muted-foreground">Portfolio PDF if you don&apos;t work in tech, or any extra work that helps clients say yes. Up to 5 files, 5 MB each.</span>
      </div>
      <input id="extra-file" name="file" type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={() => form.current?.requestSubmit()} />
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border bg-panel p-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-[0.625rem] font-semibold ring-1 ring-border">{f.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
              <div className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-medium">{f.name}</span><span className="text-xs text-muted-foreground">{f.sizeKb} KB</span></div>
              <button type="button" disabled={removing} onClick={() => startRemove(async () => { const r = await deleteExtraFileAction(f.id); if (r.error) toast.error(r.error); else toast.success("File removed"); })} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white hover:text-destructive" aria-label={`Remove ${f.name}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <label htmlFor="extra-file" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-sm font-medium hover:bg-panel">
          <Plus className="size-4 text-muted-foreground" />{pending ? "Uploading…" : files.length ? "Add another file" : "Add a file"}
        </label>
      )}
    </form>
  );
}
