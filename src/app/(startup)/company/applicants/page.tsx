import { requireUser } from "@/lib/auth";

export const metadata = { title: "Applicants · Folio" };

// STARTUP INTERFACE (owner: startup builder). Placeholder page.
export default async function Page() {
  await requireUser("/company/applicants", "company");
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold tracking-[-0.025em]">Applicants</h1>
        <p className="text-[15px] text-muted-foreground">Everyone who applied to your projects, with their CV and strengths. Accept or decline here.</p>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-sm text-muted-foreground">To build.</div>
    </div>
  );
}
