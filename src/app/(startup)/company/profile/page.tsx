import { Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { initials } from "@/components/shell/Sidebar";
import { CompanyProjectCard } from "@/components/startup/CompanyProjectCard";
import { requireUser } from "@/lib/auth";
import { countIssuedCredentials, getCompanyProjects, getOrganization } from "@/lib/data/startup";

export const metadata = { title: "Company profile · Folio" };

const STATUS_BADGE = {
  verified: ["✓ Verified", "text-[#166534]"],
  pending: ["Under review", "text-[#92400e]"],
  rejected: ["Changes needed", "text-[#b91c1c]"],
  draft: ["Not verified", "text-muted-foreground"],
} as const;

// STARTUP INTERFACE (owner: startup builder). The company as students see it.
export default async function CompanyProfile() {
  const user = await requireUser("/company/profile", "company");
  const org = await getOrganization(user);
  if (!org) redirect("/company/verify");
  const projects = await getCompanyProjects(user);
  const issued = await countIssuedCredentials(projects);
  const open = projects.filter((p) => p.status === "open");
  const [badge, badgeCls] = STATUS_BADGE[org.status];
  const details = [
    ["Founded", org.founded || "–"],
    ["Team", org.teamSize || "–"],
    ["Website", org.website],
    ["Projects posted", String(projects.length)],
    ["Verified credentials issued", String(issued)],
  ];

  return (
    <div className="page-enter flex flex-col gap-7">
      <div className="flex flex-wrap items-center gap-[18px]">
        <span className="grid size-[72px] place-items-center rounded-2xl bg-brand-halo text-[22px] font-semibold text-brand-navy">{initials(org.name)}</span>
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[32px] font-semibold tracking-[-0.025em]">{org.name}</h1>
            <span className={`inline-flex h-[22px] items-center rounded-md border bg-white px-2 text-xs font-medium ${badgeCls}`}>{badge}</span>
          </div>
          {org.hood && <p className="text-[15px] text-muted-foreground">{org.hood}</p>}
        </div>
        <Link href="/company/profile/edit" className="grid h-9 place-items-center rounded-lg border bg-white px-3.5 text-sm font-medium hover:bg-muted">Edit profile</Link>
      </div>

      {org.status !== "verified" && (
        <Link href="/company/verify" className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-600 hover:border-zinc-400">
          Students only see verified companies’ projects. <span className="font-medium text-brand">{org.status === "pending" ? "Check your verification" : "Finish verification →"}</span>
        </Link>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <span className="text-base font-semibold">About</span>
          <p className="whitespace-pre-wrap text-pretty text-sm leading-relaxed text-zinc-700">{org.about}</p>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-zinc-100 px-5 py-3 text-sm last:border-b-0">
              <span className="text-muted-foreground">{k}</span>
              {k === "Website" && v ? <a href={`https://${v}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">{v}</a> : <span className="font-medium">{v}</span>}
            </div>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Open projects</h2>
        {open.length === 0 ? <p className="text-sm text-muted-foreground">No open projects right now.</p> : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">{open.map((p) => <CompanyProjectCard key={p.id} p={p} />)}</div>
        )}
      </section>
      {issued > 0 && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5 text-[#16a34a]" />Every credential is a project you verified.</p>}
    </div>
  );
}
