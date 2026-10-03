"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { resendCompanyCodeAction, verifyCompanyEmailAction } from "@/app/actions/startup";
import { Logo } from "@/components/shared/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";

// Company sign in / create account + verification frame (design: "Folio Startup", signed-out state).
const STEPS = [
  ["Create your account", "Name, work email and password"],
  ["Verify your email", "Enter the 6-digit code we send you"],
  ["Company details", "Legal name, CIF, website and location"],
  ["Upload documents", "Registry extract, representative ID, bank certificate"],
  ["Review & submit", "Check everything and confirm"],
  ["Folio verification", "We review within 1–2 business days"],
] as const;

export const primaryBtn = "h-9 whitespace-nowrap rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-45";
export const outlineBtn = "grid h-9 place-items-center rounded-lg border bg-white px-3.5 text-sm font-medium hover:bg-muted";

/** Navy panel with the 6-step tracker on the left, content on the right. `current` null = just listing the steps. */
export function AuthFrame({ title, sub, current, allDone, children }: { title: string; sub: string; current: number | null; allDone?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-cream">
      <aside className="flex max-w-[520px] flex-[1_1_380px] flex-col gap-10 bg-brand-navy px-11 py-10 text-white">
        <Link href="/" className="self-start text-[13px] text-brand-low hover:text-white">← Back to Folio</Link>
        <div className="flex items-center gap-2.5">
          <Logo size={40} onDark />
          <div className="flex flex-col leading-tight"><span className="text-base font-semibold">Folio</span><span className="text-xs text-brand-low">For companies</span></div>
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="text-balance text-[28px] font-semibold leading-tight tracking-[-0.02em]">{title}</h2>
          <p className="text-pretty text-[15px] leading-relaxed text-brand-low">{sub}</p>
        </div>
        <ol className="flex flex-col">
          {STEPS.map(([label, s], i) => {
            const n = i + 1, done = current !== null && (n < current || !!allDone), cur = n === current && !done, last = n === STEPS.length;
            return (
              <li key={label} className="flex gap-3.5" aria-current={cur ? "step" : undefined}>
                <div className="flex flex-col items-center">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-xs font-semibold",
                    done ? "border-[#22a55a] bg-[#22a55a] text-white" : cur ? "border-white bg-white text-brand-navy" : "border-brand-low/50 text-brand-low")}>
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
                  </span>
                  {!last && <span className={cn("min-h-[18px] w-[1.5px] flex-1", done ? "bg-[#22a55a]" : "bg-brand-low/30")} />}
                </div>
                <div className="flex flex-col gap-0.5 pb-5 pt-1">
                  <span className={cn("text-sm font-semibold", current === null || cur || done ? "text-white" : "text-brand-low")}>{label}</span>
                  <span className="text-[13px] leading-snug text-brand-low">{s}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
      <main className="flex flex-[1_1_420px] justify-center px-8 py-14">
        <div className="flex w-full max-w-[460px] flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

export function StepHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-medium text-brand">{eyebrow}</span>
      <h1 className="text-[28px] font-semibold tracking-[-0.025em]">{title}</h1>
      <p className="text-pretty text-[15px] leading-normal text-muted-foreground">{sub}</p>
    </div>
  );
}

/** White card with a grey footer bar (Back left; hint + primary button right). */
export function StepCard({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-[18px] p-6">{children}</div>
      {footer && <div className="flex items-center justify-between gap-3 rounded-b-xl border-t bg-panel px-6 py-3.5">{footer}</div>}
    </div>
  );
}

export function Field({ id, label, hint, ...props }: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-10 bg-white" {...props} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

const COPY = {
  signin: ["Post projects for IE students", "To post a project, your company needs a verified account. This is what we’ll ask for."],
  signup: ["Get verified to post projects", "Every company on Folio is checked before students see its projects. Here’s where you are."],
} as const;

function EmailCode({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyCompanyEmailAction, {});
  const [code, setCode] = useState("");
  const [resending, startResend] = useTransition();
  const resend = () => startResend(async () => {
    const r = await resendCompanyCodeAction(email);
    if (r.error) toast.error(r.error); else toast("Code sent", { description: `Check ${email}.` });
  });
  return (
    <>
      <StepHeading eyebrow="Step 2 of 5" title="Verify your email" sub={`Enter the 6-digit code we sent to ${email}. You can also click the link in that email.`} />
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <StepCard footer={<>
          <Link href="/company/signin" className={outlineBtn}>Back</Link>
          <div className="flex items-center gap-3">
            {code.length < 6 && <span className="text-xs text-muted-foreground">Enter all 6 digits</span>}
            <button type="submit" disabled={code.length < 6 || pending} className={primaryBtn}>{pending ? "Checking…" : "Continue"}</button>
          </div>
        </>}>
          <div className="grid gap-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" name="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-[52px] bg-white px-4 font-mono text-2xl tracking-[0.4em]" />
          </div>
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <button type="button" onClick={resend} disabled={resending} className="self-start text-[13px] text-brand hover:underline disabled:opacity-50">{resending ? "Sending…" : "Resend code"}</button>
        </StepCard>
      </form>
    </>
  );
}

export function CompanyAuth({ mode, next }: { mode: "signin" | "signup"; next?: string }) {
  const up = mode === "signup";
  const [state, action, pending] = useActionState<FormState, FormData>(up ? signUpAction : signInAction, {});
  const [email, setEmail] = useState("");
  const sentTo = up && state.notice ? email.trim().toLowerCase() : null; // account created, waiting for the email code
  const [title, sub] = COPY[mode];
  const tab = (on: boolean) => cn("grid h-[34px] place-items-center rounded-[7px] text-sm font-medium transition-colors", on ? "bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,.08)]" : "text-muted-foreground hover:text-foreground");

  return (
    <AuthFrame title={title} sub={sub} current={up ? (sentTo ? 2 : 1) : null}>
      {!sentTo && (
        <div className="grid grid-cols-2 gap-1 rounded-[10px] bg-[#efe9dd] p-1">
          <Link href="/company/signin" className={tab(!up)} aria-current={!up ? "page" : undefined}>Sign in</Link>
          <Link href="/company/signup" className={tab(up)} aria-current={up ? "page" : undefined}>Create account</Link>
        </div>
      )}

      {!up && <>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Welcome back</h1>
          <p className="text-[15px] text-muted-foreground">Sign in to manage your projects and applicants.</p>
        </div>
        <form action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          {next && <input type="hidden" name="next" value={next} />}
          <Field id="email" label="Work email" type="email" autoComplete="email" placeholder="you@company.com" required />
          <Field id="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" required />
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <button type="submit" disabled={pending} className="h-10 rounded-lg bg-brand text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60">{pending ? "One moment…" : "Sign in"}</button>
        </form>
        <p className="text-sm text-zinc-600">New to Folio? <Link href="/company/signup" className="font-medium text-brand hover:underline">Create a company account</Link></p>
      </>}

      {up && !sentTo && <>
        <StepHeading eyebrow="Step 1 of 5" title="Create your company account" sub="Takes about 5 minutes. You can post projects once Folio has verified your company." />
        <form action={action}>
          <input type="hidden" name="role" value="company" />
          <StepCard footer={<>
            <Link href="/company/signin" className={outlineBtn}>Back</Link>
            <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Creating…" : "Create account"}</button>
          </>}>
            <Field id="fullName" label="Full name" autoComplete="name" placeholder="Marta Ruiz" required />
            <Field id="email" label="Work email" type="email" autoComplete="email" placeholder="marta@nubolabs.es" value={email} onChange={(e) => setEmail(e.target.value)} hint="Use your company domain. It helps us confirm you work there." required />
            <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
            {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          </StepCard>
        </form>
      </>}

      {sentTo && <EmailCode email={sentTo} />}
    </AuthFrame>
  );
}
