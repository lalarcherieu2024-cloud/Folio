import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteProjectButton } from "@/components/shared/DeleteProjectButton";
import { PayButton } from "@/components/startup/PayButton";
import { card, PageHeader } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getEscrow } from "@/lib/data/payments";
import { getCompanyProject, getOrganization } from "@/lib/data/startup";
import { PaymentDocuments } from "@/components/startup/CompanyVerify";
import { isStartup, paymentDocsDone } from "@/lib/org";
import { eurFromCents, paymentsMode } from "@/lib/payments/config";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pay to publish · Folio" };

// STARTUP INTERFACE. The company pays up front; Folio holds the money until the work is verified.
export default async function PayPage(props: PageProps<"/company/projects/[id]/pay">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const user = await requireUser(`/company/projects/${id}/pay`, "company");
  const p = await getCompanyProject(user, id);
  if (!p) notFound();
  const escrow = await getEscrow(id);
  if (!escrow) redirect(`/company/projects/${id}`);
  if (escrow.status !== "awaiting_payment") redirect(`/company/projects/${id}`);
  const mode = paymentsMode();
  // Verification stage 2: the registry extract and ID, before the company's first payment (migration 0030).
  const org = await getOrganization(user);
  const docsDone = paymentDocsDone(org);
  const error = typeof sp.error === "string" ? sp.error : null;

  const rows: [string, string, boolean?][] = [
    ["Paid to the student when you verify their work", eurFromCents(escrow.amountCents)],
    ["Folio fee (15%)", eurFromCents(escrow.feeCents)],
    ["You pay today", eurFromCents(escrow.totalCents), true],
  ];

  return (
    <div className="page-enter flex max-w-[38.75rem] flex-col gap-6">
      <Link href={`/company/projects/${id}`} className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Back to project</Link>
      <PageHeader title="Pay to publish" sub={`“${p.title}” is saved but students can't see it yet. Pay to open it to applications.`} />

      {mode === "simulated" && <p className="rounded-lg border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-[0.8125rem] text-[#92400e]"><b className="font-semibold">Test mode.</b> No real money moves: paying just marks the project as paid.</p>}
      {mode === "off" && <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[0.8125rem] text-[#991b1b]">Payments aren&apos;t set up on this site yet.</p>}
      {error && <p role="alert" className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[0.8125rem] font-medium text-[#991b1b]">{error}</p>}
      {sp.cancelled && <p className="rounded-lg bg-muted px-4 py-3 text-[0.8125rem] text-zinc-700">You left PayPal without paying. Nothing was charged.</p>}

      <div className={cn(card, "overflow-hidden")}>
        {rows.map(([k, v, total]) => (
          <div key={k} className={cn("flex items-center justify-between gap-4 border-b px-5 py-3.5 text-sm last:border-b-0", total && "bg-panel font-semibold")}>
            <span className={total ? "" : "text-muted-foreground"}>{k}</span><span className="font-mono">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border bg-white p-4 text-[0.8125rem] text-zinc-600">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#16a34a]" />
        <p>Folio keeps your payment safe until you&apos;ve checked the work. The student is paid only after they submit it and you verify it. If you ask for changes, the money stays held while they fix it.</p>
      </div>

      {org && !docsDone && (
        <div className={cn(card, "flex flex-col gap-4 p-5")}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-brand">One last check before you pay</span>
            <h2 className="text-lg font-semibold tracking-tight">{isStartup(org) ? "Confirm it’s you" : `Confirm you can act for ${org.name || "the company"}`}</h2>
            <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">{isStartup(org) ? "Upload your ID once" : "Upload these once"}; you won&apos;t be asked again. They&apos;re stored privately and seen only by Folio&apos;s review team. <Link href="/legal/privacy#company-verification" className="underline underline-offset-2 hover:text-foreground">How we handle them</Link></p>
          </div>
          <PaymentDocuments org={org} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {mode !== "off" && !docsDone && <span className="text-[0.8125rem] text-muted-foreground">{isStartup(org) ? "Upload your ID to pay." : "Upload both documents to pay."}</span>}
        {mode !== "off" && docsDone && <PayButton projectId={id} mode={mode} label={`Pay ${eurFromCents(escrow.totalCents)}${mode === "paypal" ? " with PayPal" : ""}`} />}
        <DeleteProjectButton projectId={id} title={p.title} redirectTo="/company/projects" />
      </div>
    </div>
  );
}
