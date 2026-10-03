import { Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PostedToast } from "@/components/startup/PostedToast";
import { hueFor, Pill, StatusPill } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getCompanyProject } from "@/lib/data/startup";
import { cn } from "@/lib/utils";
import { eur, weeksLabel } from "@/lib/work";

export const metadata = { title: "Project · Folio" };

// STARTUP INTERFACE (owner: startup builder). The project as students see it.
export default async function CompanyProjectPage(props: PageProps<"/company/projects/[id]">) {
  const { id } = await props.params;
  const { posted } = await props.searchParams;
  const user = await requireUser(`/company/projects/${id}`, "company");
  const p = await getCompanyProject(user, id);
  if (!p) notFound();
  const hue = hueFor(p.category);
  const applicants = `${p.applicantCount} applicant${p.applicantCount === 1 ? "" : "s"}`;
  const stats = [["Pay", eur(p.priceEur)], ["Duration", weeksLabel(p.weeks)], ["Applicants", String(p.applicantCount)]];

  return (
    <div className="page-enter flex max-w-[860px] flex-col gap-6">
      {posted && <PostedToast />}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3">
        <span className="min-w-[200px] flex-1 text-[13px] text-zinc-600">Public view. This is what students see when they open your project.</span>
        <Link href={`/company/applicants?project=${p.id}`} className={cn(buttonVariants({ variant: "outline" }), "h-8 px-3 text-[13px]")}>View {applicants}</Link>
      </div>

      <article className="overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <div className="border-b px-7 pb-5 pt-6" style={{ background: hue.bg }}>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground">{p.orgName ?? p.clientName}</span>
            {p.orgVerified && <span className="inline-flex h-5 items-center gap-1 rounded-md border bg-white px-1.5 text-[11px] font-medium text-[#166534]"><Check className="size-3" />Verified</span>}
            <span>· {p.hood}</span>
            <StatusPill status={p.status} className="ml-auto" />
          </div>
          <h1 className="mt-2.5 text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em]">{p.title}</h1>
        </div>
        <div className="grid grid-cols-3 border-b">
          {stats.map(([k, v], i) => (
            <div key={k} className={cn("flex flex-col gap-0.5 px-7 py-4", i > 0 && "border-l")}>
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="font-mono text-[15px] font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 px-7 py-6">
          <p className="max-w-[68ch] text-pretty text-[15px] leading-relaxed">{p.summary}</p>
          <section className="flex flex-col gap-2.5">
            <h2 className="text-sm font-semibold">Deliverable{p.deliverables.length > 1 ? "s" : ""}</h2>
            {p.deliverables.map((d) => (
              <div key={d} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded border"><Check className="size-3 text-zinc-400" strokeWidth={3} /></span>
                <span>{d}</span>
              </div>
            ))}
          </section>
          {p.skills.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <h2 className="text-sm font-semibold">Skills needed</h2>
              <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <Pill key={s} hue={hue}>{s}</Pill>)}</div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
