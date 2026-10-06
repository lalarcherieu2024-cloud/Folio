import { PostProjectWizard } from "@/components/startup/PostProjectWizard";
import { PageHeader } from "@/components/startup/ui";
import { VerifyGate } from "@/components/startup/VerifyGate";
import { requireUser } from "@/lib/auth";
import { getOrganization, getProjectDraft } from "@/lib/data/startup";
import { draftStep } from "@/lib/drafts";

export const metadata = { title: "Post a project · Folio" };

// STARTUP INTERFACE (owner: startup builder). Only verified companies can post.
export default async function NewCompanyProject({ searchParams }: PageProps<"/company/projects/new">) {
  const user = await requireUser("/company/projects/new", "company");
  const { draft: draftParam } = await searchParams;
  const [org, draft] = await Promise.all([getOrganization(user), typeof draftParam === "string" ? getProjectDraft(user, draftParam) : null]);
  // Until the company is verified the page is the verification gate alone, full width; the wizard keeps its header.
  if (org?.status !== "verified") return <div className="page-enter"><VerifyGate org={org} /></div>;
  return (
    <div className="page-enter flex max-w-[47.5rem] flex-col gap-7">
      <PageHeader title={draft ? "Finish your draft" : "Post a project"} sub={draft ? "Pick up where you left off. Save again any time, or publish when it’s ready." : "Fixed price, clear finish line. Save a draft any time and finish it later."} />
      <PostProjectWizard key={draft?.id ?? "new"} clientName={org.name} hood={org.hood || "Madrid"} draftId={draft?.id} initial={draft?.data} initialStep={draft ? Math.min(draft.step, draftStep(draft.data)) : 1} />
    </div>
  );
}
