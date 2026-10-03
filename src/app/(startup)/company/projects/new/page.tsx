import Link from "next/link";
import { PostProjectWizard } from "@/components/startup/PostProjectWizard";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";

export const metadata = { title: "Post a project · Folio" };

// STARTUP INTERFACE (owner: startup builder). Only verified companies can post.
export default async function NewCompanyProject() {
  const user = await requireUser("/company/projects/new", "company");
  const org = await getOrganization(user);
  return (
    <div className="page-enter flex max-w-[760px] flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em]">Post a project</h1>
        <p className="text-[15px] text-muted-foreground">Fixed price, clear finish line. Students see it as soon as you publish.</p>
      </div>
      {org?.status === "verified" ? <PostProjectWizard clientName={org.name} hood={org.hood || "Madrid"} /> : (
        <div className="flex flex-col items-start gap-3 rounded-xl border bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <h2 className="text-lg font-semibold">{org?.status === "pending" ? "Your company is under review" : "Get verified to post projects"}</h2>
          <p className="text-sm text-muted-foreground">
            {org?.status === "pending" ? "Folio is checking your documents, usually within 1–2 business days. You can post as soon as it’s done."
              : "Every company on Folio is checked before students see its projects. It takes about 5 minutes."}
          </p>
          <Link href="/company/verify" className="grid h-9 place-items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90">{org?.status === "pending" ? "See status" : "Continue verification"}</Link>
        </div>
      )}
    </div>
  );
}
