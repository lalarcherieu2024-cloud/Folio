import { requireUser } from "@/lib/auth";

export const metadata = { title: "Post a project · Folio" };

// STARTUP INTERFACE (owner: startup builder). Placeholder page.
export default async function Page() {
  await requireUser("/company/projects/new", "company");
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Post a project</h1>
        <p className="text-[0.9375rem] text-muted-foreground">Create a project (reuse the AI brief builder) with the company set as the client.</p>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-sm text-muted-foreground">To build.</div>
    </div>
  );
}
