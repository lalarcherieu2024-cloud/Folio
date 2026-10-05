"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { SKIP_EMAIL_CONFIRMATION } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode, next, role = "student" }: { mode: "signin" | "signup"; next?: string; role?: "student" | "company" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "signup" ? signUpAction : signInAction, {});
  const up = mode === "signup";
  const field = (id: string, label: string, props: React.ComponentProps<typeof Input>, hint?: string) => (
    <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} name={id} className="h-9" {...props} />{hint && <span className="text-xs text-muted-foreground">{hint}</span>}</div>
  );
  return (
    <form action={action} className="grid gap-4 rounded-xl border bg-white p-7 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{up ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm text-muted-foreground">{up ? (role === "company" ? "For startups and small businesses. Post a project in minutes." : "Free for IE students. Add your CV next.") : "Sign in to apply and track your work."}</p>
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="role" value={role} />
      {up && field("fullName", "Full name", { autoComplete: "name", required: true })}
      {up && field("program", "Programme and year (optional)", { placeholder: "e.g. BBA, 2027" })}
      {field("email", "Email", { type: "email", autoComplete: "email", required: true }, up && !SKIP_EMAIL_CONFIRMATION ? "Use your @student.ie.edu address to earn the verified badge." : undefined)}
      {field("password", "Password", { type: "password", autoComplete: up ? "new-password" : "current-password", required: true, minLength: up ? 8 : undefined }, up ? "At least 8 characters." : undefined)}
      {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      {state.notice && <p role="status" className="rounded-lg bg-[#e0f2fe] px-3 py-2.5 text-sm font-medium text-[#0c4a6e]">{state.notice}</p>}
      <Button type="submit" disabled={pending} className="h-10 w-full">{pending ? "One moment…" : up ? "Create account" : "Sign in"}</Button>
      <p className="text-center text-sm text-muted-foreground">
        {up ? <>Already have an account? <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">Sign in</Link></> : <>New to Folio? <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">Create an account</Link></>}
      </p>
      <p className="border-t pt-4 text-center text-sm text-muted-foreground">
        Hiring students? <Link href={up ? "/company/signup" : "/company/signin"} className="font-medium text-foreground underline underline-offset-4">{up ? "Create a company account" : "Company sign in"}</Link>
      </p>
    </form>
  );
}
