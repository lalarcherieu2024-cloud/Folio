import { BriefBuilder } from "@/components/BriefBuilder";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Request help · Folio" };

export default async function NewProject() {
  await requireUser("/projects/new");
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold tracking-[-0.025em]">Request help</h1>
        <p className="max-w-[62ch] text-[15px] text-muted-foreground">Tell us what you want built. AI turns it into a brief with clear deliverables, then another IE student can pick it up.</p>
      </div>
      <BriefBuilder />
    </div>
  );
}
