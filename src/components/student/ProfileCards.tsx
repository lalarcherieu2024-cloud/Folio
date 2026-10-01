"use client";

import { Upload } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { FormState } from "@/lib/form";
import { updateProfileAction, uploadCvAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StudentProfile } from "@/lib/types";

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
    <form ref={form} action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1"><span className="text-base font-semibold">CV</span><span className="text-[13px] text-muted-foreground">Required to apply. PDF is scored for your strengths; Word is stored as-is. Up to 5 MB.</span></div>
      {input}
      {cv ? (
        <div className="flex items-center gap-3 rounded-lg border bg-panel p-3">
          <span className="grid size-10 place-items-center rounded-md bg-white text-[11px] font-semibold ring-1 ring-border">{cv.fileName.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
          <div className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-medium">{cv.fileName}</span><span className="text-xs text-muted-foreground">{cv.sizeKb} KB</span></div>
          <label htmlFor="cv-file" className="inline-flex h-8 cursor-pointer items-center rounded-md border bg-white px-3 text-[13px] font-medium hover:bg-muted">{pending ? "Uploading…" : "Replace"}</label>
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

export function LinksCard({ user }: { user: StudentProfile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("Profile saved");
    if (state.error) toast.error(state.error);
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1"><span className="text-base font-semibold">Details and links</span><span className="text-[13px] text-muted-foreground">GitHub and LinkedIn are optional and shown as unverified for now.</span></div>
      <div className="grid gap-3">
        <div className="grid gap-1.5"><Label htmlFor="fullName">Name</Label><Input id="fullName" name="fullName" defaultValue={user.fullName} className="h-9" /></div>
        <div className="grid gap-1.5"><Label htmlFor="program">Programme and year</Label><Input id="program" name="program" defaultValue={user.program} className="h-9" /></div>
        <div className="grid gap-1.5"><Label htmlFor="github">GitHub username</Label><Input id="github" name="github" defaultValue={user.githubHandle ?? ""} placeholder="octocat" className="h-9" /></div>
        <div className="grid gap-1.5"><Label htmlFor="linkedin">LinkedIn profile link</Label><Input id="linkedin" name="linkedin" defaultValue={user.linkedinUrl ?? ""} placeholder="https://www.linkedin.com/in/…" className="h-9" /></div>
      </div>
      <Button type="submit" disabled={pending} className="h-9 self-start px-3.5">{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
