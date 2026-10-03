import { BriefBuilder } from "@/components/student/BriefBuilder";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Post a project · Folio" };

export default async function NewProject() {
  await requireUser("/projects/new", "student");
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Post a project</h1>
        <p className="max-w-[62ch] text-[0.9375rem] text-muted-foreground">Tell us what you need. AI turns it into a clear brief, then another IE student can pick it up.</p>
      </div>
      <BriefBuilder />
    </div>
  );
}
