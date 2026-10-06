"use client";

import { Check, ImageUp, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { removeCompanyDocAction, submitVerificationAction, uploadCompanyDocAction, uploadLogoAction } from "@/app/actions/startup";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Organization } from "@/lib/data/startup";
import type { StudentProfile } from "@/lib/types";
import { ConnectAccounts } from "@/components/student/ConnectAccounts";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { Field, outlineBtn, primaryBtn, StepCard, StepHeading } from "./CompanyAuth";
import { VerifyFrame } from "./VerifyFrame";
import { detailsComplete, isStartup, paymentDocsFor, type PaymentDoc } from "@/lib/org";
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

/** Company logo (optional, recommended): shown on every project card so students recognise the brand. */
function LogoRow({ org }: { org: Organization | null }) {
  const router = useRouter();
  const [uploading, startUpload] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const upload = (file: File) => startUpload(async () => {
    const f = new FormData();
    f.set("photo", file);
    const r = await uploadLogoAction(f);
    if (r.error) toast.error(r.error); else { toast.success("Logo uploaded"); router.refresh(); }
  });
  const has = !!org?.logoUrl;
  return (
    <div className={cn("flex items-center gap-3.5 rounded-lg border p-3.5", has ? "border-[#bbf7d0] bg-[#f0fdf4]" : "bg-white")}>
      {has ? <UserAvatar name={org!.name} url={org!.logoUrl} className="size-9 rounded-lg" />
        : <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-primary"><ImageUp className="size-4" /></span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">Company logo</span>
        <span className="truncate text-xs leading-snug text-muted-foreground">{has ? "✓ Shown on your profile and every project you post" : "Optional. Square image, JPG, PNG or WebP, up to 2 MB"}</span>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <Button variant={has ? "outline" : "default"} size="sm" onClick={() => input.current?.click()} disabled={uploading} className={cn("h-8 px-3 text-[0.8125rem]", has && "bg-white")}>{uploading ? "Uploading…" : has ? "Replace" : "Upload"}</Button>
    </div>
  );
}

// Step 2: check the details, add the founder's LinkedIn, and send it to Folio. LinkedIn is asked for here rather
// than on the details form because connecting it leaves the page (LinkedIn sign-in) and would lose typed details.
function Review({ org, user }: { org: Organization; user: StudentProfile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitVerificationAction, {});
  const startup = isStartup(org);
  const groups = [
    { title: "Account", edit: null, rows: [["Name", user.fullName], ["Email", `${user.email} ✓`]] },
    startup
      ? { title: "Student startup", edit: "/company/verify?step=3", rows: [["Name", org.name], ["Your IE email", org.founderIeEmail], ["Website or LinkedIn", org.website], ["Location", org.hood || "–"]] }
      : { title: "Company", edit: "/company/verify?step=3", rows: [["Legal name", org.name], ["CIF / NIF", org.cif], ["Website", org.website], ["Location", org.hood || "–"]] },
  ];
  return (
    <form action={action}>
      <StepCard footer={<>
        <Link href="/company/verify?step=3" className={outlineBtn}>Back</Link>
        <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Submitting…" : "Submit for review"}</button>
      </>}>
        {groups.map((g) => (
          <div key={g.title} className="flex flex-col gap-2 border-b border-zinc-100 pb-3.5">
            <div className="flex justify-between"><span className="text-sm font-semibold">{g.title}</span>{g.edit && <Link href={g.edit} className="text-[0.8125rem] font-medium underline underline-offset-4">Edit</Link>}</div>
            {g.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-[0.8125rem]"><span className="text-muted-foreground">{k}</span><span className="truncate text-right font-medium">{v}</span></div>)}
          </div>
        ))}
        <div className="flex flex-col gap-3 border-b border-zinc-100 pb-3.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Your LinkedIn</span>
            <span className="text-[0.8125rem] text-muted-foreground">So we can see who&apos;s behind the company. Connecting it also gives you a &ldquo;LinkedIn verified&rdquo; badge.</span>
          </div>
          <ConnectAccounts user={user} providers={["linkedin_oidc"]} next="/company/verify?step=5" title="" notes={{ linkedin_oidc: "Quickest: proves the profile is yours." }} />
          {!user.linkedinVerified && (
            <Field id="founderLinkedin" label="Or paste a link to your LinkedIn profile" defaultValue={user.linkedinUrl ?? ""} placeholder="linkedin.com/in/your-name" />
          )}
        </div>
        <LogoRow org={org} />
        <label className="flex cursor-pointer items-start gap-2.5 text-[0.8125rem] leading-normal text-zinc-700">
          <input type="checkbox" name="agree" required className="mt-0.5 size-[1.125rem] shrink-0 accent-primary" />
          <span>{startup
            ? "I'm a founder of this startup, and I will pay students the agreed amount once I verify their delivery."
            : "I can act on behalf of this company, and we will pay students the agreed amount once we verify their delivery."}</span>
        </label>
        {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      </StepCard>
    </form>
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
    { label: "Submitted", sub: "Your company details and LinkedIn were received", mark: "✓", tone: "done" },
    verified ? { label: "Folio checks your company", sub: isStartup(org) ? "IE email, website and LinkedIn confirmed" : "CIF, website and LinkedIn confirmed", mark: "✓", tone: "done" }
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
        <Link href="/company/verify?step=3" className={cn(primaryBtn, "h-10")}>Fix and resubmit</Link>
      </>}
      {verified ? <Link href="/company" className={cn(primaryBtn, "h-10")}>Go to dashboard</Link>
        : <Link href="/company/projects/new" className={cn(outlineBtn, "h-10")}>Write your first project while you wait</Link>}
    </StepCard>
  );
}

export function CompanyVerify({ step, org, user, founder = false }: { step: 3 | 5 | 6; org: Organization | null; user: StudentProfile; founder?: boolean }) {
  const verified = org?.status === "verified";
  const status6 = verified
    ? { eyebrow: "Verified", title: "Your company is verified", sub: "You can now publish projects and review applicants." }
    : org?.status === "rejected"
      ? { eyebrow: "Changes needed", title: "We couldn’t verify your company yet", sub: "Fix what’s below and submit again." }
      : { eyebrow: "Under review", title: "Your company is under review", sub: "We usually finish within 1–2 business days. Check back here to see the result." };
  return (
    // The frame counts the steps 1–3: details (page step 3), review and submit (5), Folio's review (6).
    <VerifyFrame step={step === 3 ? 1 : step === 5 ? 2 : 3} allDone={step === 6 && verified}
      // Before submitting, details and review can be reopened (review once the details are complete).
      stepHref={(n) => step < 6 && (n === 1 || (n === 2 && detailsComplete(org))) ? `/company/verify?step=${n === 1 ? 3 : 5}` : null}>
      {step === 3 && <>
        <StepHeading eyebrow="Step 1 of 2" title={isStartup(org) || (!org && founder) ? "Your startup" : "Company details"} sub="This appears on your public profile and on every project you post." />
        {/* No "Later" here: the way out is "Finish later" in the frame's top bar. */}
        <CompanyDetailsForm org={org} then="verify" founder={founder} />
      </>}
      {step === 5 && org && <>
        <StepHeading eyebrow="Step 2 of 2" title="Review and submit" sub="Check your details, add your LinkedIn, and send it to Folio." />
        <Review org={org} user={user} />
      </>}
      {step === 6 && org && <>
        <StepHeading {...status6} />
        <Status org={org} />
      </>}
    </VerifyFrame>
  );
}
