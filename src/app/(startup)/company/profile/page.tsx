import { Check, Pencil } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CompanyProjectCard } from "@/components/startup/CompanyProjectCard";
import { card, chip, TONES } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { countIssuedCredentials, getCompanyProjects, getOrganization } from "@/lib/data/startup";
import { cn } from "@/lib/utils";

export const metadata = { title: "Company profile · Folio" };

const STATUS_BADGE = {
  verified: ["Verified", TONES.success],
  pending: ["Under review", TONES.warning],
  rejected: ["Changes needed", TONES.danger],
  draft: ["Not verified", TONES.muted],
} as const;

// STARTUP INTERFACE (owner: startup builder). The company as students see it.
export default async function CompanyProfile() {
  const user = await requireUser("/company/profile", "company");
  const org = await getOrganization(user);
  if (!org) redirect("/company/verify");
  const projects = await getCompanyProjects(user);
  const issued = await countIssuedCredentials(projects);
  const open = projects.filter((p) => p.status === "open");
  const [badge, tone] = STATUS_BADGE[org.status];
  const details = [
    ["Founded", org.founded || "–"],
    ["Team", org.teamSize || "–"],
    ["Website", org.website],
    ["Projects posted", String(projects.length)],
    ["Verified credentials issued", String(issued)],
  ];

  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar name={org.name} className="size-16 rounded-xl text-xl" />
        <div className="flex min-w-[15rem] flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.025em]">{org.name}</h1>
            <span className={cn(chip, tone)}>{org.status === "verified" && <Check className="size-3" strokeWidth={3} />}{badge}</span>
          </div>
          {org.hood && <p className="text-[0.9375rem] text-muted-foreground">{org.hood}</p>}
        </div>
        <Link href="/company/profile/edit" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5 bg-white px-3 text-[0.8125rem]")}><Pencil className="size-3.5" />Edit profile</Link>
      </div>

      {org.status !== "verified" && (
        <Link href="/company/verify" className="rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600 hover:border-zinc-400">
          Students only see verified companies’ projects. <span className="font-medium text-foreground underline underline-offset-4">{org.status === "pending" ? "Check your verification" : "Finish verification"}</span>
        </Link>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className={cn(card, "p-5")}>
          <h2 className="text-sm font-semibold">About</h2>
          <p className="mt-2 whitespace-pre-wrap text-pretty text-[0.9375rem] leading-relaxed">{org.about}</p>
        </div>
        <div className={cn(card, "overflow-hidden")}>
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-zinc-100 px-5 py-3 text-sm last:border-b-0">
              <span className="text-muted-foreground">{k}</span>
              {k === "Website" && v ? <a href={`https://${v}`} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">{v}</a> : <span className="font-medium">{v}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Open projects <span className="font-mono text-sm font-normal text-muted-foreground">{open.length}</span></h2>
        {open.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-sm text-muted-foreground">No open projects right now.</div> : (
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{open.map((p) => <CompanyProjectCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
