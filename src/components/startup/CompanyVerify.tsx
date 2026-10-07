"use client";

import { Check, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { removeCompanyDocAction, uploadCompanyDocAction } from "@/app/actions/startup";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Organization } from "@/lib/data/startup";
import type { StudentProfile } from "@/lib/types";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { outlineBtn, primaryBtn, StepCard, StepHeading } from "./CompanyAuth";
import { VerifyFrame } from "./VerifyFrame";
import { isStartup, paymentDocsFor, type PaymentDoc } from "@/lib/org";
import { CompanyDetailsForm } from "./CompanyDetailsForm";



function DocRow({ kind, title, sub, file }: PaymentDoc & { file?: { fileName: string; sizeKb: number } }) {
  const [state, action, uploading] = useActionState<FormState, FormData>(uploadCompanyDocAction, {});
  const [removing, startRemove] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => { if (state !== seen.current) { seen.current = state; if (state.error) toast.error(state.error); } }, [state]);
  const remove = () => startRemove(async () => { const r = await removeCompanyDocAction(kind); if (r.error) toast.error(r.error); });
  return (
    <div className={cn("flex items-center gap-3.5 rounded-lg border p-3.5", file ? "border-[#bbf7d0] bg-[#f0fdf4]" : "bg-white")}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", file ? "bg-[#dcfce7] text-[#166534]" : "bg-soft text-primary")}>
        {file ? <Check className="size-4" strokeWidth={2.5} /> : <Upload className="size-4" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="truncate text-xs leading-snug text-muted-foreground">{file ? `✓ ${file.fileName} · ${file.sizeKb} KB` : sub}</span>
      </div>
      {file ? (
        <Button variant="outline" size="sm" onClick={remove} disabled={removing} className="h-8 bg-white px-3 text-[0.8125rem]">{removing ? "Removing…" : "Remove"}</Button>
      ) : (
        <form ref={form} action={action}>
          <input type="hidden" name="kind" value={kind} />
          <label className={cn(buttonVariants({ size: "sm" }), "h-8 cursor-pointer px-3 text-[0.8125rem]", uploading && "pointer-events-none opacity-60")}>
            {uploading ? "Uploading…" : "Upload"}
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { if (e.target.files?.length) form.current?.requestSubmit(); }} />
          </label>
        </form>
      )}
    </div>
  );
}

/** Stage 2, on the payment page: the documents Folio needs before a company's first payment. */
export function PaymentDocuments({ org }: { org: Organization }) {
  return (
    <div className="flex flex-col gap-2.5">
      {paymentDocsFor(org).map((d) => <DocRow key={d.kind} {...d} file={org.docs.find((x) => x.kind === d.kind)} />)}
    </div>
  );
}

function Status({ org }: { org: Organization }) {
  const verified = org.status === "verified", rejected = org.status === "rejected";
  const rows = [
    { label: "Submitted", sub: "Your company details were received", mark: "✓", tone: "done" },
    verified ? { label: "Folio checks your company", sub: isStartup(org) ? "IE email and website confirmed" : "CIF and website confirmed", mark: "✓", tone: "done" }
      : rejected ? { label: "Folio checks your company", sub: "Something needs fixing (see below)", mark: "!", tone: "bad" }
      : { label: "Folio checks your company", sub: isStartup(org) ? "We email your IE address to confirm it's you · usually 1–2 business days" : "Against public records · usually 1–2 business days", mark: "…", tone: "wait" },
    { label: "Verified badge on your profile", sub: "Unlocks publishing projects. Meanwhile you can already write your first one.", mark: verified ? "✓" : "3", tone: verified ? "done" : "todo" },
  ];
  const tone = { done: "bg-[#22c55e] text-white", wait: "bg-[#fef3c7] text-[#92400e]", bad: "bg-[#fee2e2] text-[#991b1b]", todo: "bg-secondary text-muted-foreground" } as const;
  return (
    <StepCard>
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3">
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold", tone[r.tone as keyof typeof tone])}>{r.mark}</span>
          <div className="flex flex-col gap-0.5"><span className="text-sm font-medium">{r.label}</span><span className="text-[0.8125rem] text-muted-foreground">{r.sub}</span></div>
        </div>
      ))}
      {rejected && <>
        {org.reviewNote && <p className="rounded-lg bg-[#fee2e2] px-3.5 py-3 text-sm text-[#991b1b]">{org.reviewNote}</p>}
        <Link href="/company/verify?edit=1" className={cn(primaryBtn, "h-10")}>Fix and resubmit</Link>
      </>}
      {verified ? <Link href="/company" className={cn(primaryBtn, "h-10")}>Go to dashboard</Link>
        : <Link href="/company/projects/new" className={cn(outlineBtn, "h-10")}>Write your first project while you wait</Link>}
    </StepCard>
  );
}

export function CompanyVerify({ step, org, user, founder = false }: { step: 1 | 2; org: Organization | null; user: StudentProfile; founder?: boolean }) {
  const verified = org?.status === "verified";
  const status = verified
    ? { eyebrow: "Verified", title: "Your company is verified", sub: "You can now publish projects and review applicants." }
    : org?.status === "rejected"
      ? { eyebrow: "Changes needed", title: "We couldn’t verify your company yet", sub: "Fix what’s below and send it again." }
      : { eyebrow: "Under review", title: "Your company is under review", sub: "We usually finish within 1–2 business days. We'll let you know as soon as you can publish." };
  return (
    // Two steps: the details, sent for review in one go (1), then Folio's review (2).
    <VerifyFrame step={step} allDone={step === 2 && verified}>
      {step === 1 && <>
        <StepHeading eyebrow="About 2 minutes" title={isStartup(org) || (!org && founder) ? "Your startup" : "Your company"} sub="Shown on your public profile and on every project you post. Folio checks it once, usually within 1–2 business days." />
        {/* No "Later" here: the way out is "Save and exit" in the frame's top bar. */}
        <CompanyDetailsForm org={org} user={user} then="verify" founder={founder} />
      </>}
      {step === 2 && org && <>
        <StepHeading {...status} />
        <Status org={org} />
      </>}
    </VerifyFrame>
  );
}
