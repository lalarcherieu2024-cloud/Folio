import { Check, ExternalLink, Globe, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { CredentialCard } from "@/components/shared/CredentialCard";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { getSession } from "@/lib/auth";
import { getPublicCompany } from "@/lib/data/companies";
import { getSavedIds } from "@/lib/data/student";
import { cn } from "@/lib/utils";
import { viewerFrom } from "@/lib/work";

export async function generateMetadata(props: PageProps<"/companies/[id]">) {
  const { id } = await props.params;
  const c = await getPublicCompany(id);
  return { title: c ? `${c.name} · Folio` : "Company · Folio" };
}

const chip = "inline-flex h-[1.375rem] items-center gap-1 rounded-md px-2 text-xs font-medium";
const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[0.8125rem] font-medium hover:bg-muted";
const href = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

// A verified company as students see it: who they are, what they're hiring for now, and the work they've signed off.
export default async function CompanyPage(props: PageProps<"/companies/[id]">) {
  const { id } = await props.params;
  const c = await getPublicCompany(id);
  if (!c) notFound();
  const user = await getSession();
  const viewer = user?.role === "student" ? viewerFrom(user, await getSavedIds(user)) : undefined;
  const facts = [c.founded && `Founded ${c.founded}`, c.teamSize, c.hood && `${c.hood}${/madrid/i.test(c.hood) ? "" : ", Madrid"}`].filter(Boolean) as string[];
  const stats = [
    ["Projects completed", String(c.completed)],
    ["Certificates issued", String(c.certificatesIssued)],
    ["Average rating given", c.avgRatingGiven === null ? "–" : c.avgRatingGiven.toFixed(1)],
    ["Open now", String(c.openProjects.length)],
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center gap-5">
        <UserAvatar name={c.name} color={c.logoColor} url={c.logoUrl} className="size-[4.5rem] rounded-[0.875rem] text-2xl" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em]">{c.name}</h1>
          {facts.length > 0 && <p className="text-sm text-muted-foreground">{facts.join(" · ")}</p>}
          <div className="flex flex-wrap gap-2">
            <span className={cn(chip, "bg-[#dcfce7] text-[#166534]")}><Check className="size-3" strokeWidth={3} />Verified by Folio</span>
            {c.founderLinkedinVerified && <span className={cn(chip, "bg-[#e0f2fe] text-[#0c4a6e]")}><Check className="size-3" strokeWidth={3} />Founder&apos;s LinkedIn verified</span>}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {c.website && <a href={href(c.website)} target="_blank" rel="noopener noreferrer" className={btn}><Globe className="size-3.5" />Website</a>}
          {c.linkedinUrl && <a href={href(c.linkedinUrl)} target="_blank" rel="noopener noreferrer" className={cn(btn, "text-[#0a66c2]")}><ExternalLink className="size-3.5" />LinkedIn</a>}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-2 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
          <h2 className="text-base font-semibold">About</h2>
          <p className="whitespace-pre-wrap text-pretty text-[0.9375rem] leading-relaxed text-zinc-700">{c.about || "This company hasn't written a description yet."}</p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl border bg-white p-4 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="inline-flex items-center gap-1 font-mono text-xl font-semibold">{value}{label.startsWith("Average") && value !== "–" && <Star className="size-4 fill-[#f59e0b] text-[#f59e0b]" />}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Open projects <span className="font-mono text-sm font-normal text-muted-foreground">{c.openProjects.length}</span></h2>
        {c.openProjects.length === 0
          ? <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-sm text-muted-foreground">No open projects right now. Check back soon.</div>
          : <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{c.openProjects.map((p) => <ProjectCard key={p.id} p={p} viewer={viewer} />)}</div>}
      </section>

      {c.recentCertificates.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Work they&apos;ve verified</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
            {c.recentCertificates.map((cert) => (
              <div key={cert.id} className="flex flex-col gap-2">
                <CredentialCard c={cert} />
                <span className="text-xs text-muted-foreground">Earned by <span className="font-medium text-foreground">{cert.student}</span></span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
