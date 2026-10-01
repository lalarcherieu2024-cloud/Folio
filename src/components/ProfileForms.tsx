"use client";

import { useActionState } from "react";
import { updateProfileAction, uploadCvAction, type FormState } from "@/app/actions";
import type { StudentProfile } from "@/lib/types";
import { Field, FormError } from "./Field";

export function CvForm({ cv }: { cv: StudentProfile["cv"] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadCvAction, {});
  return (
    <form action={action} className="rounded-xl border border-line bg-surface p-5">
      <h3 className="text-lg">Your CV</h3>
      {cv && <p className="mt-1 text-sm font-semibold text-green">✓ {cv.fileName} ({cv.sizeKb} KB)</p>}
      <p className="mb-3 mt-1 text-sm text-muted">{cv ? "Upload a new file to replace it." : "PDF or Word, up to 5 MB. Clients see it when you apply."}</p>
      <input name="cv" type="file" accept=".pdf,.doc,.docx" aria-label="CV file" className="mb-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-soft file:px-4 file:py-2 file:font-bold file:text-blue" />
      <FormError msg={state.error} />
      {state.ok && <p className="mb-3 text-sm font-semibold text-green">CV saved.</p>}
      <button disabled={pending} className="btn btn-quiet">{pending ? "Uploading…" : cv ? "Replace CV" : "Upload CV"}</button>
    </form>
  );
}

export function DetailsForm({ user }: { user: StudentProfile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="rounded-xl border border-line bg-surface p-5">
      <h3 className="mb-3 text-lg">Profile and links</h3>
      <Field label="Name" htmlFor="fullName"><input id="fullName" name="fullName" defaultValue={user.fullName} className="input" /></Field>
      <Field label="Programme and year" htmlFor="program"><input id="program" name="program" defaultValue={user.program} className="input" /></Field>
      <Field label="GitHub username (optional)" htmlFor="github" hint="Shows on your profile. Automatic verification of your repos comes with the next phase."><input id="github" name="github" defaultValue={user.githubHandle ?? ""} placeholder="octocat" className="input" /></Field>
      <Field label="LinkedIn profile link (optional)" htmlFor="linkedin" hint="Not required. Verification with LinkedIn sign-in comes with the next phase."><input id="linkedin" name="linkedin" defaultValue={user.linkedinUrl ?? ""} placeholder="https://www.linkedin.com/in/…" className="input" /></Field>
      <FormError msg={state.error} />
      {state.ok && <p className="mb-3 text-sm font-semibold text-green">Saved.</p>}
      <button disabled={pending} className="btn">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
