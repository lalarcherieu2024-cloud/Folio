import { BriefBuilder } from "@/components/BriefBuilder";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Request help · Folio" };

export default async function NewProject() {
  await requireUser("/projects/new");
  return (
    <>
      <h1 className="text-4xl">Request help on your project</h1>
      <p className="mb-8 mt-2 max-w-[62ch] text-muted">Got an idea but not sure how to scope it? Tell us what you want and AI will turn it into a brief with clear deliverables. Then another IE student can pick it up.</p>
      <BriefBuilder />
    </>
  );
}
