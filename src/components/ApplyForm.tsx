"use client";

import { useActionState } from "react";
import { applyAction, type FormState } from "@/app/actions";
import { FormError } from "./Field";

export function ApplyForm({ projectId, price }: { projectId: string; price: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyAction, {});
  if (state.ok) return <p className="rounded-lg bg-green-soft p-4 font-semibold text-green">Application sent. Track it under My applications.</p>;
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <label htmlFor="pitch" className="font-semibold">Why are you a good fit?</label>
      <textarea id="pitch" name="pitch" required minLength={20} rows={4} className="input" placeholder="Two or three sentences about relevant work, classes or side projects." />
      <FormError msg={state.error} />
      <button disabled={pending} className="btn self-start">{pending ? "Sending…" : `Apply for ${price}`}</button>
    </form>
  );
}
