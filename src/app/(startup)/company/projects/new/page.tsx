import { Clock } from "lucide-react";
import { PostProjectWizard, type PriceRanges } from "@/components/startup/PostProjectWizard";
import { PageHeader } from "@/components/startup/ui";
import { VerifyGate } from "@/components/startup/VerifyGate";
import { requireUser } from "@/lib/auth";
import { getOpenProjects } from "@/lib/data/projects";
import { getOrganization, getProjectDraft } from "@/lib/data/startup";
import { draftStep } from "@/lib/drafts";
import { isStartup, STARTUP_MAX_PAY } from "@/lib/org";

export const metadata = { title: "Post a project · Folio" };

// STARTUP INTERFACE (owner: startup builder). Verified companies post; while Folio reviews a company it can already
// write its first project and save it as a draft, so the wait isn't wasted.
export default async function NewCompanyProject({ searchParams }: PageProps<"/company/projects/new">) {
  const user = await requireUser("/company/projects/new", "company");
  const { draft: draftParam } = await searchParams;
  const [org, draft, open] = await Promise.all([getOrganization(user), typeof draftParam === "string" ? getProjectDraft(user, draftParam) : null, getOpenProjects()]);
  // What open projects pay per field, for the price step's "fair price" hint.
  const priceRanges: PriceRanges = {};
  for (const p of open) {
    const r = priceRanges[p.category];
    priceRanges[p.category] = r ? [Math.min(r[0], p.priceEur), Math.max(r[1], p.priceEur)] : [p.priceEur, p.priceEur];
  }
  // Not submitted yet: the page is the verification gate alone, full width; the wizard keeps its header.
  const pending = org?.status === "pending";
  if (!org || (org.status !== "verified" && !pending)) return <div className="page-enter"><VerifyGate org={org} /></div>;
  return (
    <div className="page-enter flex max-w-[47.5rem] flex-col gap-7">
      <PageHeader title={draft ? "Finish your draft" : "Post a project"} sub={draft ? "Pick up where you left off. Save again any time, or publish when it’s ready." : "Fixed price, clear finish line. Save a draft any time and finish it later."} />
      {pending && (
        <p className="flex items-start gap-2.5 rounded-lg border bg-white px-4 py-3 text-[0.8125rem] leading-relaxed text-zinc-600">
          <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
          <span><span className="font-medium text-foreground">Folio is reviewing your company.</span> Write your project now and save it as a draft; you can publish it as soon as you&apos;re verified, usually within 1–2 business days.</span>
        </p>
      )}
      <PostProjectWizard key={draft?.id ?? "new"} canPublish={!pending} clientName={org.name} hood={org.hood || "Madrid"} draftId={draft?.id} initial={draft?.data} initialStep={draft ? Math.min(draft.step, draftStep(draft.data)) : 1}
        maxPay={isStartup(org) ? STARTUP_MAX_PAY : undefined} priceRanges={priceRanges} />
    </div>
  );
}
