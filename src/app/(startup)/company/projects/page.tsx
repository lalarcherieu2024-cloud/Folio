import { requireUser } from "@/lib/auth";

export const metadata = { title: "My projects · Folio" };

// STARTUP INTERFACE (owner: startup builder). Placeholder page.
export default async function Page() {
  await requireUser("/company/projects", "company");
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold tracking-[-0.025em]">My projects</h1>
        <p className="text-[15px] text-muted-foreground">Your posted projects, with status and applicants.</p>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-sm text-muted-foreground">To build.</div>
    </div>
  );
}
