"use client";

import { Check, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateProfileAction, uploadCvAction } from "@/app/actions/student";
import { AuthFrame, Field, outlineBtn, primaryBtn, StepCard, StepHeading } from "@/components/startup/CompanyAuth";
import { ConnectAccounts } from "@/components/student/ConnectAccounts";
import { STUDENT_FRAME, STUDENT_STEPS } from "@/components/student/StudentSignup";
import type { FormState } from "@/lib/form";
import type { StudentProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export type OnboardingStep = 3 | 4 | 5 | 6;
const go = (step: OnboardingStep) => `/welcome?step=${step}`;

// Runs an action's result once: toast the error, or move on when it succeeds.
function useResult(state: FormState, onOk: () => void) {
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast.error(state.error);
    if (state.ok) onOk();
  }, [state, onOk]);
}

function Details({ user }: { user: StudentProfile }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const [v, setV] = useState({ program: user.program, payout: user.payoutLink ?? "" });
  useResult(state, () => router.push(go(4)));
  return (
    <>
      <StepHeading eyebrow="Step 3 of 6" title="Your details" sub="Clients see your programme when you apply. The payout link is where you get paid." />
      <form action={action}>
        <input type="hidden" name="fullName" value={user.fullName} />
        <StepCard footer={<>
          <span />
          <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Saving…" : "Continue"}</button>
        </>}>
          <Field id="program" label="Programme and year" placeholder="e.g. BBA, 2027" value={v.program} onChange={(e) => setV({ ...v, program: e.target.value })} hint="Helps clients match you to the right projects." />
          <Field id="payout" label="PayPal payout link (optional)" placeholder="https://paypal.me/yourname" value={v.payout} onChange={(e) => setV({ ...v, payout: e.target.value })} hint="You can add this later, before your first project is paid." />
        </StepCard>
      </form>
    </>
  );
}

function Cv({ user }: { user: StudentProfile }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(uploadCvAction, {});
  const form = useRef<HTMLFormElement>(null);
  useResult(state, () => { toast.success("CV uploaded"); router.refresh(); });
  const cv = user.cv;
  return (
    <>
      <StepHeading eyebrow="Step 4 of 6" title="Upload your CV" sub="Clients read it next to your pitch. You need one to apply. PDF or Word, up to 5 MB." />
      <form ref={form} action={action}>
        <input id="cv-file" name="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={() => form.current?.requestSubmit()} />
        <StepCard footer={<>
          <Link href={go(3)} className={outlineBtn}>Back</Link>
          <div className="flex items-center gap-3">
            {!cv && <Link href={go(5)} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Skip for now</Link>}
            <Link href={go(5)} aria-disabled={!cv} className={cn(primaryBtn, !cv && "pointer-events-none opacity-50")}>Continue</Link>
          </div>
        </>}>
          <label htmlFor="cv-file" className={cn("flex cursor-pointer items-center gap-3.5 rounded-lg border p-3.5 transition-colors hover:border-zinc-400", cv ? "border-brand-low bg-soft/50" : "border-dashed bg-white")}>
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", cv ? "bg-brand text-white" : "bg-soft text-primary")}>
              {cv ? <Check className="size-4" strokeWidth={2.5} /> : <Upload className="size-4" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{pending ? "Uploading…" : cv ? "CV uploaded" : "Choose your CV"}</span>
              <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">{cv ? <><FileText className="size-3.5" />{cv.fileName} · click to replace</> : "PDF is scored for your strengths; Word is stored as-is."}</span>
            </span>
          </label>
        </StepCard>
      </form>
    </>
  );
}

function Accounts({ user }: { user: StudentProfile }) {
  return (
    <>
      <StepHeading eyebrow="Step 5 of 6" title="Verify your accounts" sub="Connecting LinkedIn proves the profile is yours and adds a verified badge. GitHub is optional, for tech work." />
      <StepCard footer={<>
        <Link href={go(4)} className={outlineBtn}>Back</Link>
        <Link href={go(6)} className={primaryBtn}>{user.linkedinVerified || user.githubVerified ? "Continue" : "Skip for now"}</Link>
      </>}>
        <ConnectAccounts user={user} returnTo={go(5)} />
      </StepCard>
    </>
  );
}

function Done({ user }: { user: StudentProfile }) {
  const items = [
    ["Email verified", true],
    ["Details added", !!user.program],
    ["CV uploaded", !!user.cv],
    ["Accounts verified", user.linkedinVerified || user.githubVerified],
  ] as const;
  return (
    <>
      <StepHeading eyebrow="Step 6 of 6" title={`You're all set, ${user.fullName.split(" ")[0]}`} sub="Pick a project, send a short pitch, and your CV goes with it." />
      <StepCard footer={<>
        <Link href="/profile" className={outlineBtn}>Go to my profile</Link>
        <Link href="/projects" className={primaryBtn}>Browse projects</Link>
      </>}>
        <ul className="grid gap-2.5">
          {items.map(([label, done]) => (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              <span className={cn("grid size-5 place-items-center rounded-full border", done ? "border-brand bg-brand text-white" : "bg-white")}>{done && <Check className="size-3" strokeWidth={3} />}</span>
              <span className={done ? "" : "text-muted-foreground"}>{label}{!done && " · you can finish this on your profile"}</span>
            </li>
          ))}
        </ul>
      </StepCard>
    </>
  );
}

export function StudentOnboarding({ step, user }: { step: OnboardingStep; user: StudentProfile }) {
  return (
    <AuthFrame title={STUDENT_FRAME.title} sub={STUDENT_FRAME.sub} current={step} allDone={step === 6} steps={STUDENT_STEPS} audience="For students">
      {step === 3 && <Details user={user} />}
      {step === 4 && <Cv user={user} />}
      {step === 5 && <Accounts user={user} />}
      {step === 6 && <Done user={user} />}
    </AuthFrame>
  );
}
