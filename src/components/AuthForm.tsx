"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type FormState } from "@/app/actions";
import { Field, FormError } from "./Field";

export function AuthForm({ mode, next }: { mode: "signin" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signup" ? signUpAction : signInAction, {});
  const up = mode === "signup";
  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-7">
      <h1 className="mb-1 text-3xl">{up ? "Create your account" : "Welcome back"}</h1>
      <p className="mb-6 text-muted">{up ? "Student account. You can add your CV and links next." : "Sign in to apply and track your projects."}</p>
      {next && <input type="hidden" name="next" value={next} />}
      {up && (
        <>
          <Field label="Full name" htmlFor="fullName"><input id="fullName" name="fullName" autoComplete="name" required className="input" /></Field>
          <Field label="Programme and year (optional)" htmlFor="program"><input id="program" name="program" placeholder="e.g. BBA, 2027" className="input" /></Field>
        </>
      )}
      <Field label="University email" htmlFor="email" hint={up ? "Use your @student.ie.edu address to get the verified-student badge." : undefined}>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </Field>
      {up && (
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
        </Field>
      )}
      {!up && <p className="mb-4 rounded-lg bg-amber-soft p-3 text-sm text-amber-ink">Demo mode: sign in with just an email. Try <b>lucia@student.ie.edu</b>. Real passwords arrive with the Supabase step.</p>}
      <FormError msg={state.error} />
      <button disabled={pending} className="btn w-full">{pending ? "One moment…" : up ? "Create account" : "Sign in"}</button>
      <p className="mt-5 text-center text-sm text-muted">
        {up ? <>Already have an account? <Link href="/signin" className="font-semibold text-blue">Sign in</Link></> : <>New to Folio? <Link href="/signup" className="font-semibold text-blue">Create an account</Link></>}
      </p>
    </form>
  );
}
