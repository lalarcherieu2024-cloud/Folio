"use client";

import Link from "next/link";
import { RoleSwitch } from "@/components/shared/RoleSwitch";
import { SignOutButton, StartOverButton } from "@/components/shared/SignupExits";
import { AuthFrame, COMPANY_FRAME, outlineBtn, primaryBtn, StepCard, StepHeading } from "@/components/startup/CompanyAuth";
import { STUDENT_FRAME, STUDENT_STEPS } from "@/components/student/StudentSignup";
import type { UnfinishedSignup } from "@/lib/data/signup";
import type { Role } from "@/lib/types";

// Shown instead of a sign-up form when this browser is already partway through a sign-up: continue that one, or
// delete it and start from scratch as `to` (the sign-up page that was opened, student or company).
export function UnfinishedSignupScreen({ signup, to }: { signup: UnfinishedSignup; to: Role }) {
  const was = signup.role === "company" ? "company" : "student";
  const frame = to === "company" ? { ...COMPANY_FRAME } : { ...STUDENT_FRAME, steps: STUDENT_STEPS, audience: "For students" };
  return (
    <AuthFrame {...frame} current={null}>
      <RoleSwitch role={to} />
      <StepHeading eyebrow="Already signing up" title="Continue, or start from scratch?"
        sub={<>You&apos;re signed in as <span className="font-medium text-foreground">{signup.email}</span>, partway through setting up a {was} account.</>} />
      <StepCard footer={<>
        <SignOutButton className="text-[0.8125rem] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" />
        <Link href={signup.continueHref} className={primaryBtn}>Continue setting up</Link>
      </>}>
        {signup.canStartOver ? (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {to === signup.role
                ? "Signed up with the wrong details? Start from scratch: your unfinished account is deleted, and you can use the same email again."
                : `Meant to sign up as a ${to}? Start from scratch: your unfinished ${was} account is deleted first, and you can use the same email for the ${to} account.`}
            </p>
            <StartOverButton email={signup.email} to={to} className={`${outlineBtn} w-fit`}>Start from scratch as a {to}</StartOverButton>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">This account can&apos;t be deleted from here. Sign out to sign up with a different email.</p>
        )}
      </StepCard>
    </AuthFrame>
  );
}
