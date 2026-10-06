"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { LinkedInButton, OrDivider } from "@/components/shared/LinkedInButton";
import { RoleSwitch, type AccountRole } from "@/components/shared/RoleSwitch";
import { TermsConsent, TermsNotice } from "@/components/shared/TermsConsent";
import { SKIP_EMAIL_CONFIRMATION } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sign-in is shared by students and companies (each account lands on its own home); the switch only changes the wording.
const SIGNIN_COPY: Record<AccountRole, { sub: string; email: string; placeholder: string; signup: string }> = {
  student: { sub: "Sign in to apply and track your work.", email: "Email", placeholder: "you@student.ie.edu", signup: "/signup" },
  company: { sub: "Sign in to manage your projects and applicants.", email: "Work email", placeholder: "you@company.com", signup: "/company/signup" },
};

export function AuthForm({ mode, next, role = "student", error }: { mode: "signin" | "signup"; next?: string; role?: AccountRole; error?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signup" ? signUpAction : signInAction, {});
  const [who, setWho] = useState<AccountRole>(role);
  const up = mode === "signup";
  const copy = SIGNIN_COPY[who];
  const field = (id: string, label: string, props: React.ComponentProps<typeof Input>, hint?: string) => (
    <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} className="h-9" {...props} />{hint && <span className="text-xs text-muted-foreground">{hint}</span>}</div>
  );
  return (
    <form action={action} className="grid gap-4 rounded-xl border bg-white p-7 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      {up ? <RoleSwitch role="student" /> : <RoleSwitch role={who} onSelect={setWho} />}
      <div className="mt-2 grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{up ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm text-muted-foreground">{up ? (role === "company" ? "For startups and small businesses. Post a project in minutes." : "Free for IE students. Add your CV next.") : copy.sub}</p>
      </div>
      {/* LinkedIn sign-in is for students only: a new LinkedIn account always becomes a student. */}
      {!up && who === "student" && <><LinkedInButton next={next} /><TermsNotice /><OrDivider>or with email</OrDivider></>}
      {next && <input type="hidden" name="next" value={next} />}
      {/* Sign-in checks the account matches the side picked in the switch (signInAction). */}
      <input type="hidden" name="role" value={up ? role : who} />
      {up && field("fullName", "Full name", { autoComplete: "name", required: true })}
      {up && field("program", "Programme and year (optional)", { placeholder: "e.g. BBA, 2027" })}
      {field("email", up ? "Email" : copy.email, { type: "email", autoComplete: "email", required: true, placeholder: up ? undefined : copy.placeholder }, up && !SKIP_EMAIL_CONFIRMATION ? "Use your @student.ie.edu address to earn the verified badge." : undefined)}
      {field("password", "Password", { type: "password", autoComplete: up ? "new-password" : "current-password", required: true, minLength: up ? 8 : undefined }, up ? "At least 8 characters." : undefined)}
      {up && <TermsConsent />}
      {(state.error ?? error) && <p role="alert" className="text-sm font-medium text-destructive">{state.error ?? error}</p>}
      {state.notice && <p role="status" className="rounded-lg bg-[#e0f2fe] px-3 py-2.5 text-sm font-medium text-[#0c4a6e]">{state.notice}</p>}
      <Button type="submit" disabled={pending} className="h-10 w-full">{pending ? "One moment…" : up ? "Create account" : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {up
          ? <>Already have an account? <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">Sign in</Link></>
          : <>New to Folio? <Link href={copy.signup} className="font-medium text-foreground underline underline-offset-4">{who === "company" ? "Create a company account" : "Create an account"}</Link></>}
      </p>    </form>
  );
}
