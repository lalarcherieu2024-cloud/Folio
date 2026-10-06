"use client";

import { BadgeCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { signUpAction } from "@/app/actions/auth";
import { resendCompanyCodeAction } from "@/app/actions/startup";
import { LinkedInButton, OrDivider } from "@/components/shared/LinkedInButton";
import { TermsConsent, TermsNotice } from "@/components/shared/TermsConsent";
import { RoleSwitch } from "@/components/shared/RoleSwitch";
import { AuthFrame, Field, outlineBtn, primaryBtn, StepCard, StepHeading } from "@/components/startup/CompanyAuth";
import { SKIP_EMAIL_CONFIRMATION } from "@/lib/config";
import type { FormState } from "@/lib/form";

// Student sign-up, mirroring the company flow (CompanyAuth + CompanyVerify): same frame, same step tracker.
// Steps 1–2 happen here; 3–6 run signed in on /welcome (StudentOnboarding).
export const STUDENT_STEPS: readonly (readonly [string, string])[] = [
  ["Create your account", "Name, university email and password"],
  SKIP_EMAIL_CONFIRMATION ? ["Email check", "Skipped for now"] : ["Confirm your email", "Click the link we email you"],
  ["Your photo and details", "Photo, programme and payout link"],
  ["Upload your CV", "Clients read it when you apply"],
  ["Verify your accounts", "LinkedIn, and GitHub if you do tech work"],
  ["Start applying", "Find a project that fits you"],
] as const;

export const STUDENT_FRAME = { title: "Start doing real, paid work", sub: "Set up your profile once, then apply to any project in a couple of clicks. Here’s where you are." };

// Mirrors allowed_email_domains in supabase/migrations/0001_init.sql.
const isUniEmail = (e: string) => ["ie.edu", "student.ie.edu"].includes(e.trim().split("@")[1]?.toLowerCase() ?? "");

// Step 2: Supabase's confirmation email carries a link (no 6-digit code). Clicking it lands on
// /auth/callback, which signs the student in and continues to /welcome.
function CheckEmail({ email }: { email: string }) {
  const [resending, startResend] = useTransition();
  // The resend call is generic (Supabase "signup" email), despite living with the company actions.
  const resend = () => startResend(async () => {
    const r = await resendCompanyCodeAction(email);
    if (r.error) toast.error(r.error); else toast("Email sent again", { description: `Check ${email}.` });
  });
  return (
    <>
      <StepHeading eyebrow="Step 2 of 6" title="Check your inbox" sub={<>We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to confirm your email, and you&apos;ll come straight back to set up your profile.</>} />
      <StepCard footer={<>
        <Link href="/signup" className={outlineBtn}>Back</Link>
        <Link href="/signin" className={primaryBtn}>I&apos;ve confirmed, sign in</Link>
      </>}>
        <div className="flex items-start gap-3.5 rounded-lg bg-panel p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-brand ring-1 ring-border"><Mail className="size-5" /></span>
          <ol className="grid gap-1.5 text-sm text-zinc-600">
            <li><span className="font-mono text-xs text-brand">1</span> Open the email from Folio</li>
            <li><span className="font-mono text-xs text-brand">2</span> Click the confirmation link</li>
            <li><span className="font-mono text-xs text-brand">3</span> Carry on with your details, CV and accounts</li>
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">Open the link in this browser so you stay signed in. No email after a few minutes? Check your spam folder.</p>
        <button type="button" onClick={resend} disabled={resending} className="self-start text-[0.8125rem] font-medium underline underline-offset-4 disabled:opacity-50">{resending ? "Sending…" : "Send the email again"}</button>
      </StepCard>
    </>
  );
}

export function StudentSignup() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  const [email, setEmail] = useState("");
  // Account created, waiting for the confirmation link. With SKIP_EMAIL_CONFIRMATION on there is no email step: sign-up goes
  // straight to /welcome, and a notice only means "created, now sign in".
  const sentTo = state.notice && !SKIP_EMAIL_CONFIRMATION ? email.trim().toLowerCase() : null;

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
            {/* Skips the password and the email check; LinkedIn also counts as verified straight away. */}
            <LinkedInButton label="Sign up with LinkedIn" />
            <TermsNotice action="signing up with LinkedIn" />
            <OrDivider>or with your university email</OrDivider>
            <Field id="fullName" label="Full name" autoComplete="name" placeholder="Lucía Fernández" required />
            <div className="grid gap-1.5">
              <Field id="email" label="University email" type="email" autoComplete="email" placeholder="you@student.ie.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {email.includes("@") && !SKIP_EMAIL_CONFIRMATION && (isUniEmail(email)
                ? <span className="flex items-center gap-1.5 text-xs font-medium text-brand"><BadgeCheck className="size-3.5" />You&apos;ll get the verified IE student badge.</span>
                : <span className="text-xs text-muted-foreground">Use your @student.ie.edu address to get the verified student badge.</span>)}
            </div>
            <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
            <TermsConsent />
            {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
            {state.notice && SKIP_EMAIL_CONFIRMATION && <p role="status" className="text-sm font-medium text-brand">{state.notice} <Link href="/signin" className="underline underline-offset-4">Sign in</Link></p>}
          </StepCard>
        </form>
        <p className="text-sm text-muted-foreground">Already have an account? <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">Sign in</Link></p>
      </>}
      {sentTo && <CheckEmail email={sentTo} />}
    </AuthFrame>
  );
}
