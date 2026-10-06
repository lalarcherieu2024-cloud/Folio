import Link from "next/link";
import { PostProjectWizard } from "@/components/startup/PostProjectWizard";
import { card, PageHeader } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getOrganization, getProjectDraft } from "@/lib/data/startup";
import { draftStep } from "@/lib/drafts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Post a project · Folio" };

// STARTUP INTERFACE (owner: startup builder). Only verified companies can post.
export default async function NewCompanyProject({ searchParams }: PageProps<"/company/projects/new">) {
  const user = await requireUser("/company/projects/new", "company");
  const { draft: draftParam } = await searchParams;
  const [org, draft] = await Promise.all([getOrganization(user), typeof draftParam === "string" ? getProjectDraft(user, draftParam) : null]);
  const pending = org?.status === "pending";
  return (
    <div className="page-enter flex max-w-[47.5rem] flex-col gap-7">
      <PageHeader title={draft ? "Finish your draft" : "Post a project"} sub={draft ? "Pick up where you left off. Save again any time, or publish when it’s ready." : "Fixed price, clear finish line. Save a draft any time and finish it later."} />
      {org?.status === "verified" ? <PostProjectWizard key={draft?.id ?? "new"} clientName={org.name} hood={org.hood || "Madrid"} draftId={draft?.id} initial={draft?.data} initialStep={draft ? Math.min(draft.step, draftStep(draft.data)) : 1} /> : (
        <div className={cn(card, "flex flex-col items-start gap-3 p-6")}>
          <h2 className="text-lg font-semibold tracking-tight">{pending ? "Your company is under review" : "Get verified to post projects"}</h2>
          <p className="text-sm text-muted-foreground">
            {pending ? "Folio is checking your documents, usually within 1–2 business days. You can post as soon as it’s done."
              : "Every company on Folio is checked before students see its projects. It takes about 5 minutes."}
          </p>
          <Link href="/company/verify" className={cn(buttonVariants(), "h-9 px-4")}>{pending ? "See status" : "Continue verification"}</Link>
        </div>
      )}
    </div>
  );
}
