"use client";

import { Building2, Rocket } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCompanyDetailsAction } from "@/app/actions/startup";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organization, OrgKind } from "@/lib/data/startup";
import type { FormState } from "@/lib/form";
import { STARTUP_MAX_PAY } from "@/lib/org";
import { cn } from "@/lib/utils";
import { Field, outlineBtn, primaryBtn, StepCard } from "./CompanyAuth";

const KINDS: { kind: OrgKind; icon: typeof Building2; title: string; sub: string }[] = [
  { kind: "company", icon: Building2, title: "Registered company", sub: "Has a CIF / NIF" },
  { kind: "student_startup", icon: Rocket, title: "Student startup", sub: "Your own, not registered yet" },
];

/** Company details (sign-up step 3, and "Edit profile" afterwards). Legal name and CIF lock once submitted.
 *  On the details step an IE student can pick "Student startup" (migration 0031): no CIF, their IE email instead. */
export function CompanyDetailsForm({ org, then, founder = false, backHref, backLabel = "Back", submitLabel = "Continue" }: {
  org: Organization | null; then: "verify" | "profile"; founder?: boolean; backHref?: string; backLabel?: string; submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompanyDetailsAction, {});
  const locked = org?.status === "pending" || org?.status === "verified";
  const extended = then === "profile";
  // Before the first save, "?founder=1" (the student-founder sign-up) preselects the startup option.
  const [kind, setKind] = useState<OrgKind>(org ? org.kind : founder ? "student_startup" : "company");
  const startup = kind === "student_startup";
  return (
    // The id lets the verification frame's "Finish later" save what's typed here (FinishLater in VerifyFrame).
    <form id="company-details-form" action={action}>
      <input type="hidden" name="then" value={then} />
      <input type="hidden" name="kind" value={kind} />
      <StepCard footer={<>
        {backHref ? <Link href={backHref} className={outlineBtn}>{backLabel}</Link> : <span />}
        <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Saving…" : submitLabel}</button>
      </>}>
        {!locked && !extended && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Who&apos;s hiring?</legend>
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <button key={k.kind} type="button" aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}
                  className={cn("flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors", kind === k.kind ? "border-brand bg-soft/60 ring-1 ring-brand" : "bg-white hover:border-zinc-400")}>
                  <k.icon className={cn("mt-0.5 size-4 shrink-0", kind === k.kind ? "text-brand" : "text-muted-foreground")} />
                  <span className="flex flex-col gap-0.5"><span className="text-sm font-semibold leading-tight">{k.title}</span><span className="text-xs text-muted-foreground">{k.sub}</span></span>
                </button>
              ))}
            </div>
            {startup && (
              <p className="rounded-lg bg-panel px-3 py-2.5 text-xs leading-relaxed text-zinc-600">
                For IE students hiring for their own startup. Projects go up to €{STARTUP_MAX_PAY} until it&apos;s registered, and before your first payment we only ask for your ID.
              </p>
            )}
          </fieldset>
        )}
        <Field id="name" label={startup ? "Startup name" : "Legal company name"} defaultValue={org?.name} placeholder={startup ? "Nubo Labs" : "Nubo Labs S.L."} readOnly={locked} required
          hint={locked ? "Checked by Folio, so it can't be changed here." : undefined} />
        {startup ? <>
          {!extended && (
            <Field id="founderIeEmail" label="Your IE email" type="email" defaultValue={org?.founderIeEmail} placeholder="you@student.ie.edu" readOnly={locked} required
              hint="We email it once to confirm you're the IE student behind the startup. Students don't see it." />
          )}
          <Field id="website" label="Website or LinkedIn page" defaultValue={org?.website} placeholder="nubolabs.es or linkedin.com/company/nubolabs" required />
        </> : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <Field id="cif" label="CIF / NIF" defaultValue={org?.cif} placeholder="B12345678" readOnly={locked} required />
            <Field id="website" label="Website" defaultValue={org?.website} placeholder="nubolabs.es" required />
          </div>
        )}
        <Field id="hood" label="Neighbourhood, city" defaultValue={org?.hood} placeholder="Malasaña, Madrid" />
        <div className="grid gap-1.5">
          <Label htmlFor="about">{startup ? "What does the startup do?" : "What does the company do?"}</Label>
          <Textarea id="about" name="about" defaultValue={org?.about} rows={3} required placeholder="One or two sentences students will read on your profile." className="resize-y bg-white leading-relaxed" />
        </div>
        {extended && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <Field id="founded" label="Founded (optional)" defaultValue={org?.founded} inputMode="numeric" placeholder="2024" />
            <Field id="teamSize" label="Team size (optional)" defaultValue={org?.teamSize} placeholder={startup ? "2 founders" : "11–50 employees"} />
          </div>
        )}
        {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      </StepCard>
    </form>
  );
}
