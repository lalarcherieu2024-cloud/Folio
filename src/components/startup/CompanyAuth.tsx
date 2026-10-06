"use client";

import { Check, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { resendCompanyCodeAction } from "@/app/actions/startup";
import { Logo } from "@/components/shared/Logo";
import { RoleSwitch } from "@/components/shared/RoleSwitch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SKIP_EMAIL_CONFIRMATION } from "@/lib/config";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { TermsConsent, TermsNotice } from "@/components/shared/TermsConsent";
import { LinkedInButton, OrDivider } from "@/components/shared/LinkedInButton";
import { AccountStrip, type SignupAccount } from "@/components/shared/SignupExits";

// Company sign in / create account + verification frame (design: "Folio Startup", signed-out state).
const STEPS: readonly (readonly [string, string])[] = [
  ["Create your account", "LinkedIn, or your work email and a password"],
  SKIP_EMAIL_CONFIRMATION ? ["Email check", "Skipped for now"] : ["Confirm your email", "Click the link we email you"],
  ["Company details", "Legal name, CIF, website and location"],
  ["Your LinkedIn and submit", "So we know who's behind the company"],
  ["Folio verification", "We review within 1–2 business days"],
];

export const primaryBtn = cn(buttonVariants(), "h-9 px-4");
export const outlineBtn = cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3.5");

/** The step tracker on the left (on the homepage's soft blue band), content on the right. `current` null = just
 *  listing the steps. Students reuse it with their own `steps` and `audience` (see student/StudentSignup.tsx). */
export function AuthFrame({ title, sub, current, allDone, children, steps = STEPS, audience = "For companies", account, stepHref }: {
  title: string; sub: string; current: number | null; allDone?: boolean; children: React.ReactNode; steps?: readonly (readonly [string, string])[]; audience?: string;
  /** Where clicking step n goes, for the steps someone can open right now (null: not clickable). */
  stepHref?: (n: number) => string | null;
  /** Signed in and still setting up: shows who, and every way out (sign out, start from scratch, switch role). */
  account?: SignupAccount;
}) {
  return (
    <div className="flex min-h-screen flex-wrap bg-background">
      {/* Side by side (from 50rem), the panel stays in view while the form on the right scrolls. */}
      <aside className="flex max-w-[32.5rem] flex-[1_1_23.75rem] p-3 min-[50rem]:sticky min-[50rem]:top-0 min-[50rem]:h-screen">
        <div className="flex w-full flex-col gap-9 overflow-y-auto rounded-3xl bg-soft/50 px-8 py-8 sm:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Folio home">
              <Logo size={36} />
              <span className="text-lg font-semibold tracking-tight">Folio</span>
            </Link>
            <Link href="/" className="text-[0.8125rem] text-muted-foreground hover:text-foreground">← Back to Folio</Link>
          </div>
          <div>
            <p className="text-sm font-medium text-brand">{audience}</p>
            <h2 className="mt-2 text-balance text-[2rem] font-semibold leading-[1.1] tracking-tight">{title}</h2>
            <p className="mt-3 text-pretty text-[0.9375rem] leading-relaxed text-zinc-600">{sub}</p>
          </div>
          <ol className="flex flex-col">
            {steps.map(([label, s], i) => {
              const n = i + 1, done = current !== null && (n < current || !!allDone), cur = n === current && !done, last = n === steps.length;
              const href = !cur ? stepHref?.(n) : null;
              const text = (
                <>
                  <span className={cn("text-sm font-semibold", current === null || cur || done ? "text-foreground" : "text-zinc-500", href && "underline-offset-4 group-hover/step:underline")}>{label}</span>
                  <span className="text-[0.8125rem] leading-snug text-muted-foreground">{s}</span>
                </>
              );
              return (
                <li key={label} className="flex gap-3.5" aria-current={cur ? "step" : undefined}>
                  <div className="flex flex-col items-center">
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums",
                      done ? "border-[#16a34a] bg-[#16a34a] text-white" : cur ? "border-brand bg-brand text-white ring-4 ring-brand/15" : "border-border bg-white text-muted-foreground")}>
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
                    </span>
                    {!last && <span className={cn("min-h-[1.125rem] w-px flex-1", done ? "bg-[#16a34a]" : "bg-brand/15")} />}
                  </div>
                  {href
                    ? <Link href={href} className="group/step flex flex-col gap-0.5 rounded-sm pb-5 pt-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40">{text}</Link>
                    : <div className="flex flex-col gap-0.5 pb-5 pt-1">{text}</div>}
                </li>
              );
            })}
          </ol>
          {account && <AccountStrip account={account} />}
        </div>
      </aside>
      <main className="flex flex-[1_1_26.25rem] justify-center px-8 py-14">
        <div className="flex w-full max-w-[28.75rem] flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

export function StepHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-brand">{eyebrow}</span>
      <h1 className="text-[1.875rem] font-semibold leading-tight tracking-tight">{title}</h1>
      {sub && <p className="text-pretty text-[0.9375rem] leading-normal text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** White card with a grey footer bar (Back left; hint + primary button right). */
export function StepCard({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="grid gap-4 p-5">{children}</div>
      {footer && <div className="flex items-center justify-between gap-3 rounded-b-2xl border-t bg-panel px-5 py-4">{footer}</div>}
    </div>
  );
}

export function Field({ id, label, hint, ...props }: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-9 bg-white" {...props} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** The frame of the company sign-up page, also used by the "already signing up" prompt on it. */
export const COMPANY_FRAME = { title: "Get verified to post projects", sub: "Every company on Folio is checked before students see its projects. Here’s where you are." };

const COPY = {
  signin: ["Post projects for IE students", "To post a project, your company needs a verified account. This is what we’ll ask for."],
  signup: [COMPANY_FRAME.title, COMPANY_FRAME.sub],
} as const;

// Step 2: Supabase's confirmation email carries a link (no 6-digit code). Clicking it lands on
// /auth/callback, which signs the company in and continues to /company/verify.
function CheckEmail({ email }: { email: string }) {
  const [resending, startResend] = useTransition();
  const resend = () => startResend(async () => {
    const r = await resendCompanyCodeAction(email);
    if (r.error) toast.error(r.error); else toast("Email sent again", { description: `Check ${email}.` });
  });
  return (
    <>
      <StepHeading eyebrow="Step 2 of 5" title="Check your inbox" sub={<>We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to confirm your email, and you&apos;ll come straight back to verify your company.</>} />
      <StepCard footer={<>
        <Link href="/company/signup" className={outlineBtn}>Back</Link>
        <Link href="/signin?as=company" className={primaryBtn}>I&apos;ve confirmed, sign in</Link>
      </>}>
        <div className="flex items-start gap-3.5 rounded-lg bg-panel p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-primary ring-1 ring-border"><Mail className="size-5" /></span>
          <ol className="grid gap-1.5 text-sm text-zinc-600">
            <li><span className="font-mono text-xs text-primary">1</span> Open the email from Folio</li>
            <li><span className="font-mono text-xs text-primary">2</span> Click the confirmation link</li>
            <li><span className="font-mono text-xs text-primary">3</span> Carry on with your company details and documents</li>
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">Open the link in this browser so you stay signed in. No email after a few minutes? Check your spam folder.</p>
        <button type="button" onClick={resend} disabled={resending} className="self-start text-[0.8125rem] font-medium underline underline-offset-4 disabled:opacity-50">{resending ? "Sending…" : "Send the email again"}</button>
      </StepCard>
    </>
  );
}

export function CompanyAuth({ mode, next }: { mode: "signin" | "signup"; next?: string }) {
  const up = mode === "signup";
  const [state, action, pending] = useActionState<FormState, FormData>(up ? signUpAction : signInAction, {});
  const [email, setEmail] = useState("");
  const sentTo = up && state.notice && !SKIP_EMAIL_CONFIRMATION ? email.trim().toLowerCase() : null; // account created, waiting for the confirmation link
  const [title, sub] = COPY[mode];

  return (
    <AuthFrame title={title} sub={sub} current={up ? (sentTo ? 2 : 1) : null}>
      {up && !sentTo && <RoleSwitch role="company" />}

      {!up && <>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Welcome back</h1>
          <p className="text-[0.9375rem] text-muted-foreground">Sign in to manage your projects and applicants.</p>
        </div>
        <form action={action} className="grid gap-4 rounded-xl border bg-white p-7 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
          {next && <input type="hidden" name="next" value={next} />}
          <input type="hidden" name="role" value="company" />
          <Field id="email" label="Work email" type="email" autoComplete="email" placeholder="you@company.com" required />
          <Field id="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" required />
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="h-10 w-full">{pending ? "One moment…" : "Sign in"}</Button>
        </form>
        <p className="text-sm text-muted-foreground">New to Folio? <Link href="/company/signup" className="font-medium text-foreground underline underline-offset-4">Create a company account</Link></p>
        <p className="text-sm text-muted-foreground">Are you a student? <Link href="/signin" className="font-medium text-foreground underline underline-offset-4">Student sign in</Link></p>
      </>}

      {up && !sentTo && <>
        <StepHeading eyebrow="Step 1 of 5" title="Create your company account" />
        <form action={action}>
          <input type="hidden" name="role" value="company" />
          <StepCard footer={<>
            <Link href="/company/signin" className={outlineBtn}>Back</Link>
            <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Creating…" : "Create account"}</button>
          </>}>
            {/* Skips the password and the email check; the account is made a company on the way back (/auth/callback). */}
            <LinkedInButton label="Sign up with LinkedIn" as="company" />
            <TermsNotice action="signing up with LinkedIn" />
            <OrDivider>or with your work email</OrDivider>
            <Field id="fullName" label="Full name" autoComplete="name" placeholder="Marta Ruiz" required />
            <Field id="email" label="Work email" type="email" autoComplete="email" placeholder="marta@nubolabs.es" value={email} onChange={(e) => setEmail(e.target.value)} hint="Use your company domain. It helps us confirm you work there." required />
            <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
            <TermsConsent />
            {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
            {state.notice && SKIP_EMAIL_CONFIRMATION && <p role="status" className="text-sm font-medium text-primary">{state.notice} <Link href="/signin?as=company" className="underline underline-offset-4">Sign in</Link></p>}
          </StepCard>
        </form>
        <p className="text-sm text-muted-foreground">Already have an account? <Link href="/signin?as=company" className="font-medium text-foreground underline underline-offset-4">Sign in</Link></p>
      </>}

      {sentTo && <CheckEmail email={sentTo} />}
    </AuthFrame>
  );
}
