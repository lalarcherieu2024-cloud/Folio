"use client";

import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { signUpAction, verifyStudentEmailAction } from "@/app/actions/auth";
import { resendCompanyCodeAction } from "@/app/actions/startup";
import { RoleSwitch } from "@/components/shared/RoleSwitch";
import { AuthFrame, Field, outlineBtn, primaryBtn, StepCard, StepHeading } from "@/components/startup/CompanyAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";

// Student sign-up, mirroring the company flow (CompanyAuth + CompanyVerify): same frame, same step tracker.
// Steps 1–2 happen here; 3–6 run signed in on /welcome (StudentOnboarding).
export const STUDENT_STEPS = [
  ["Create your account", "Name, university email and password"],
  ["Verify your email", "Enter the 6-digit code we send you"],
  ["Your details", "Programme, year and payout link"],
  ["Upload your CV", "Clients read it when you apply"],
  ["Verify your accounts", "LinkedIn, and GitHub if you do tech work"],
  ["Start applying", "Find a project that fits you"],
] as const;

export const STUDENT_FRAME = { title: "Start doing real, paid work", sub: "Set up your profile once, then apply to any project in a couple of clicks. Here’s where you are." };

// Mirrors allowed_email_domains in supabase/migrations/0001_init.sql.
const isUniEmail = (e: string) => ["ie.edu", "student.ie.edu"].includes(e.trim().split("@")[1]?.toLowerCase() ?? "");

function EmailCode({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyStudentEmailAction, {});
  const [code, setCode] = useState("");
  const [resending, startResend] = useTransition();
  // The resend call is generic (Supabase "signup" email), despite living with the company actions.
  const resend = () => startResend(async () => {
    const r = await resendCompanyCodeAction(email);
    if (r.error) toast.error(r.error); else toast("Code sent", { description: `Check ${email}.` });
  });
  return (
    <>
      <StepHeading eyebrow="Step 2 of 6" title="Verify your email" sub={`Enter the 6-digit code we sent to ${email}. You can also click the link in that email.`} />
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <StepCard footer={<>
          <Link href="/signup" className={outlineBtn}>Back</Link>
          <div className="flex items-center gap-3">
            {code.length < 6 && <span className="text-xs text-muted-foreground">Enter all 6 digits</span>}
            <button type="submit" disabled={code.length < 6 || pending} className={primaryBtn}>{pending ? "Checking…" : "Continue"}</button>
          </div>
        </>}>
          <div className="grid gap-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" name="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-[3.25rem] bg-white px-4 font-mono text-2xl tracking-[0.4em]" />
          </div>
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <button type="button" onClick={resend} disabled={resending} className="self-start text-[0.8125rem] font-medium underline underline-offset-4 disabled:opacity-50">{resending ? "Sending…" : "Resend code"}</button>
        </StepCard>
      </form>
    </>
  );
}

export function StudentSignup() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  const [email, setEmail] = useState("");
  const sentTo = state.notice ? email.trim().toLowerCase() : null; // account created, waiting for the email code

  return (
    <AuthFrame title={STUDENT_FRAME.title} sub={STUDENT_FRAME.sub} current={sentTo ? 2 : 1} steps={STUDENT_STEPS} audience="For students">
      {!sentTo && <RoleSwitch role="student" />}
      {!sentTo && <>
        <StepHeading eyebrow="Step 1 of 6" title="Create your account" sub="Free for IE students. Takes about 3 minutes, and you can apply as soon as your CV is up." />
        <form action={action}>
          <input type="hidden" name="role" value="student" />
          <StepCard footer={<>
            <Link href="/" className={outlineBtn}>Back</Link>
            <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Creating…" : "Create account"}</button>
          </>}>
            <Field id="fullName" label="Full name" autoComplete="name" placeholder="Lucía Fernández" required />
            <div className="grid gap-1.5">
              <Field id="email" label="University email" type="email" autoComplete="email" placeholder="you@student.ie.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {email.includes("@") && (isUniEmail(email)
                ? <span className="flex items-center gap-1.5 text-xs font-medium text-brand"><BadgeCheck className="size-3.5" />You&apos;ll get the verified IE student badge.</span>
                : <span className="text-xs text-muted-foreground">Use your @student.ie.edu address to get the verified student badge.</span>)}
            </div>
            <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
            {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          </StepCard>
        </form>
        <p className="text-sm text-muted-foreground">Already have an account? <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">Sign in</Link></p>
      </>}
      {sentTo && <EmailCode email={sentTo} />}
    </AuthFrame>
  );
}
