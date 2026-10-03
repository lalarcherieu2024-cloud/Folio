"use client";

import { Check, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { removeCompanyDocAction, submitVerificationAction, uploadCompanyDocAction } from "@/app/actions/startup";
import type { DocKind, Organization } from "@/lib/data/startup";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { AuthFrame, outlineBtn, primaryBtn, StepCard, StepHeading } from "./CompanyAuth";
import { CompanyDetailsForm } from "./CompanyDetailsForm";

const DOCS: { kind: DocKind; title: string; sub: string }[] = [
  { kind: "registry_extract", title: "Company registry extract", sub: "Nota simple from the Registro Mercantil, issued in the last 3 months" },
  { kind: "representative_id", title: "ID of the representative", sub: "DNI, NIE or passport of the person signing up" },
  { kind: "bank_certificate", title: "Bank account certificate", sub: "Certificado de titularidad in the company’s name, used to pay students" },
];

const FRAME = { title: "Get verified to post projects", sub: "Every company on Folio is checked before students see its projects. Here’s where you are." };

function DocRow({ kind, title, sub, file }: (typeof DOCS)[number] & { file?: { fileName: string; sizeKb: number } }) {
  const [state, action, uploading] = useActionState<FormState, FormData>(uploadCompanyDocAction, {});
  const [removing, startRemove] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  useEffect(() => { if (state !== seen.current) { seen.current = state; if (state.error) toast.error(state.error); } }, [state]);
  const remove = () => startRemove(async () => { const r = await removeCompanyDocAction(kind); if (r.error) toast.error(r.error); });
  return (
    <div className={cn("flex items-center gap-3.5 rounded-[10px] border p-3.5", file ? "border-[#bfe5cd] bg-[#f6fbf8]" : "bg-white")}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", file ? "bg-[#e3f5ea] text-[#166534]" : "bg-[#e6ecfb] text-brand-navy")}>
        {file ? <Check className="size-4" strokeWidth={2.5} /> : <Upload className="size-4" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="truncate text-xs leading-snug text-muted-foreground">{file ? `✓ ${file.fileName} · ${file.sizeKb} KB` : sub}</span>
      </div>
      {file ? (
        <button type="button" onClick={remove} disabled={removing} className="h-[30px] rounded-md border bg-white px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50">{removing ? "Removing…" : "Remove"}</button>
      ) : (
        <form ref={form} action={action}>
          <input type="hidden" name="kind" value={kind} />
          <label className={cn("inline-flex h-[30px] cursor-pointer items-center rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand/90", uploading && "pointer-events-none opacity-60")}>
            {uploading ? "Uploading…" : "Upload"}
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { if (e.target.files?.length) form.current?.requestSubmit(); }} />
          </label>
        </form>
      )}
    </div>
  );
}

function Review({ org, email, name }: { org: Organization; email: string; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitVerificationAction, {});
  const docName = (k: DocKind) => org.docs.find((d) => d.kind === k)?.fileName ?? "Missing";
  const groups = [
    { title: "Account", edit: null, rows: [["Name", name], ["Email", `${email} ✓`]] },
    { title: "Company", edit: "/company/verify?step=3", rows: [["Legal name", org.name], ["CIF / NIF", org.cif], ["Website", org.website], ["Location", org.hood || "–"]] },
    { title: "Documents", edit: "/company/verify?step=4", rows: DOCS.map((d) => [d.title, docName(d.kind)]) },
  ];
  return (
    <form action={action}>
      <StepCard footer={<>
        <Link href="/company/verify?step=4" className={outlineBtn}>Back</Link>
        <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Submitting…" : "Submit for review"}</button>
      </>}>
        {groups.map((g) => (
          <div key={g.title} className="flex flex-col gap-2 border-b border-zinc-100 pb-3.5">
            <div className="flex justify-between"><span className="text-[13px] font-semibold">{g.title}</span>{g.edit && <Link href={g.edit} className="text-[13px] text-brand hover:underline">Edit</Link>}</div>
            {g.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-[13px]"><span className="text-muted-foreground">{k}</span><span className="truncate text-right font-medium">{v}</span></div>)}
          </div>
        ))}
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-normal text-zinc-700">
          <input type="checkbox" name="agree" required className="mt-0.5 size-[18px] shrink-0 accent-brand" />
          <span>I can act on behalf of this company, and we will pay students the agreed amount once we verify their delivery.</span>
        </label>
        {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      </StepCard>
    </form>
  );
}

function Status({ org }: { org: Organization }) {
  const verified = org.status === "verified", rejected = org.status === "rejected";
  const rows = [
    { label: "Submitted", sub: "Your details and documents were received", mark: "✓", tone: "done" },
    verified ? { label: "Folio checks your documents", sub: "Registry, ID and bank details confirmed", mark: "✓", tone: "done" }
      : rejected ? { label: "Folio checks your documents", sub: "Something needs fixing (see below)", mark: "!", tone: "bad" }
      : { label: "Folio checks your documents", sub: "In progress · usually 1–2 business days", mark: "…", tone: "wait" },
    { label: "Verified badge on your profile", sub: "Unlocks posting projects", mark: verified ? "✓" : "3", tone: verified ? "done" : "todo" },
  ];
  const tone = { done: "bg-[#22a55a] text-white", wait: "bg-[#fdf3d8] text-[#92400e]", bad: "bg-[#fef2f2] text-[#b91c1c]", todo: "bg-secondary text-muted-foreground" } as const;
  return (
    <StepCard>
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3">
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold", tone[r.tone as keyof typeof tone])}>{r.mark}</span>
          <div className="flex flex-col gap-0.5"><span className="text-sm font-medium">{r.label}</span><span className="text-[13px] text-muted-foreground">{r.sub}</span></div>
        </div>
      ))}
      {rejected && <>
        {org.reviewNote && <p className="rounded-lg bg-[#fef2f2] px-3 py-2.5 text-sm text-[#b91c1c]">{org.reviewNote}</p>}
        <Link href="/company/verify?step=3" className={cn(primaryBtn, "grid place-items-center")}>Fix and resubmit</Link>
      </>}
      {verified ? <Link href="/company" className="grid h-10 place-items-center rounded-lg bg-[#22a55a] text-sm font-medium text-white hover:bg-[#22a55a]/90">Go to dashboard</Link>
        : <Link href="/company" className={cn(outlineBtn, "h-10")}>Look around while you wait</Link>}
    </StepCard>
  );
}

export function CompanyVerify({ step, org, email, name }: { step: 3 | 4 | 5 | 6; org: Organization | null; email: string; name: string }) {
  const docsDone = DOCS.every((d) => org?.docs.some((x) => x.kind === d.kind));
  const verified = org?.status === "verified";
  const status6 = verified
    ? { eyebrow: "Verified", title: "Your company is verified", sub: "You can now post projects and review applicants." }
    : org?.status === "rejected"
      ? { eyebrow: "Changes needed", title: "We couldn’t verify your company yet", sub: "Fix what’s below and submit again." }
      : { eyebrow: "Under review", title: "Your company is under review", sub: "We usually finish within 1–2 business days. Check back here to see the result." };
  return (
    <AuthFrame {...FRAME} current={step} allDone={step === 6 && verified}>
      {step === 3 && <>
        <StepHeading eyebrow="Step 3 of 5" title="Company details" sub="This appears on your public profile and on every project you post." />
        <CompanyDetailsForm org={org} then="verify" backHref="/company" backLabel="Later" />
      </>}
      {step === 4 && <>
        <StepHeading eyebrow="Step 4 of 5" title="Upload documents" sub="We use these to confirm the company exists and that you can act for it. PDF, JPG or PNG, up to 10 MB." />
        <StepCard footer={<>
          <Link href="/company/verify?step=3" className={outlineBtn}>Back</Link>
          <div className="flex items-center gap-3">
            {!docsDone && <span className="text-xs text-muted-foreground">Upload all three documents</span>}
            {docsDone ? <Link href="/company/verify?step=5" className={cn(primaryBtn, "grid place-items-center")}>Continue</Link>
              : <span aria-disabled className={cn(primaryBtn, "grid cursor-not-allowed place-items-center opacity-45")}>Continue</span>}
          </div>
        </>}>
          {DOCS.map((d) => <DocRow key={d.kind} {...d} file={org?.docs.find((x) => x.kind === d.kind)} />)}
        </StepCard>
      </>}
      {step === 5 && org && <>
        <StepHeading eyebrow="Step 5 of 5" title="Review & submit" sub="Check everything before sending it to Folio." />
        <Review org={org} email={email} name={name} />
      </>}
      {step === 6 && org && <>
        <StepHeading {...status6} />
        <Status org={org} />
      </>}
    </AuthFrame>
  );
}
