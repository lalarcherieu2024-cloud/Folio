"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCompanyDetailsAction } from "@/app/actions/startup";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organization } from "@/lib/data/startup";
import type { FormState } from "@/lib/form";
import { Field, outlineBtn, primaryBtn, StepCard } from "./CompanyAuth";

/** Company details (sign-up step 3, and "Edit profile" afterwards). Legal name and CIF lock once submitted. */
export function CompanyDetailsForm({ org, then, backHref, backLabel = "Back", submitLabel = "Continue" }: {
  org: Organization | null; then: "verify" | "profile"; backHref: string; backLabel?: string; submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompanyDetailsAction, {});
  const locked = org?.status === "pending" || org?.status === "verified";
  const extended = then === "profile";
  return (
    <form action={action}>
      <input type="hidden" name="then" value={then} />
      <StepCard footer={<>
        <Link href={backHref} className={outlineBtn}>{backLabel}</Link>
        <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Saving…" : submitLabel}</button>
      </>}>
        <Field id="name" label="Legal company name" defaultValue={org?.name} placeholder="Nubo Labs S.L." readOnly={locked} required
          hint={locked ? "Checked by Folio, so it can't be changed here." : undefined} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <Field id="cif" label="CIF / NIF" defaultValue={org?.cif} placeholder="B12345678" readOnly={locked} required />
          <Field id="website" label="Website" defaultValue={org?.website} placeholder="nubolabs.es" required />
        </div>
        <Field id="hood" label="Neighbourhood, city" defaultValue={org?.hood} placeholder="Malasaña, Madrid" />
        <div className="grid gap-1.5">
          <Label htmlFor="about">What does the company do?</Label>
          <Textarea id="about" name="about" defaultValue={org?.about} rows={3} required placeholder="One or two sentences students will read on your profile." className="resize-y bg-white leading-relaxed" />
        </div>
        {extended && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <Field id="founded" label="Founded (optional)" defaultValue={org?.founded} inputMode="numeric" placeholder="2024" />
            <Field id="teamSize" label="Team size (optional)" defaultValue={org?.teamSize} placeholder="11–50 employees" />
          </div>
        )}
        {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      </StepCard>
    </form>
  );
}
