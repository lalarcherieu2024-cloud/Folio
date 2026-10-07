import { ExternalLink, FileText, Search } from "lucide-react";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { ago, card, chip, TONES } from "@/components/startup/ui";
import type { ReviewCompany } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

// The admin page's company cards (/admin): one to review in full, and compact rows for the other states.

const href = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const DOC_LABEL: Record<string, string> = { registry_extract: "Registry extract", representative_id: "Representative's ID", bank_certificate: "Bank certificate" };

export function KindChip({ c }: { c: ReviewCompany }) {
  return c.kind === "student_startup"
    ? <span className={cn(chip, "bg-[#ede9fe] text-[#5b21b6]")}>Student startup</span>
    : <span className={cn(chip, TONES.info)}>Company</span>;
}

/** One company waiting for a decision: everything needed to check it, and the two buttons. */
export function ReviewCard({ c }: { c: ReviewCompany }) {
  const startup = c.kind === "student_startup";
  const facts: [string, React.ReactNode][] = [
    startup ? ["Founder's IE email", c.founderIeEmail ?? <span className="text-[#b91c1c]">Missing</span>] : ["CIF / NIF", <span key="cif" className="font-mono">{c.cif}</span>],
    ["Website", c.website ? <a key="w" href={href(c.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">{c.website}<ExternalLink className="size-3" /></a> : "–"],
    ["Location", c.hood || "–"],
    ["Signed up by", <>{c.owner.name || "–"}<span className="text-muted-foreground"> · {c.owner.email}</span></>],
    ["LinkedIn", c.owner.linkedinVerified ? <span className={cn(chip, TONES.success)}>Connected</span>
      : c.owner.linkedinUrl ? <a href={href(c.owner.linkedinUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">Profile link<ExternalLink className="size-3" /></a>
      : <span className="text-muted-foreground">Not given</span>],
  ];
  const lookup = startup ? `${c.name} startup` : `${c.name} ${c.cif}`;
  return (
    <article className={cn(card, "flex flex-col gap-4 p-5")}>
      <div className="flex flex-wrap items-center gap-3">
        <UserAvatar name={c.name || "?"} color={c.logoColor} url={c.logoUrl} className="size-11 rounded-xl text-sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2"><span className="text-base font-semibold">{c.name || "Unnamed"}</span><KindChip c={c} /></span>
          <span className="text-[0.8125rem] text-muted-foreground">Sent {c.submittedAt ? ago(c.submittedAt) : "–"}</span>
        </div>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(lookup)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-[0.8125rem] font-medium text-zinc-700 hover:bg-panel">
          <Search className="size-3.5" />Look it up
        </a>
      </div>
      <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
        {facts.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>
        ))}
      </dl>
      {c.about && <p className="rounded-lg bg-panel px-3.5 py-3 text-sm text-zinc-700">{c.about}</p>}
      {c.docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {c.docs.map((d) => (
            <a key={d.kind} href={d.url ?? "#"} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-[0.8125rem] font-medium hover:bg-panel">
              <FileText className="size-3.5" />{DOC_LABEL[d.kind] ?? d.kind}
            </a>
          ))}
        </div>
      )}
      <div className="flex justify-end border-t border-zinc-100 pt-4"><ReviewActions orgId={c.id} name={c.name} /></div>
    </article>
  );
}

export function Rows({ title, sub, items, render }: { title: string; sub: string; items: ReviewCompany[]; render: (c: ReviewCompany) => React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <section className={cn(card, "overflow-hidden")}>
      <div className="flex flex-col gap-0.5 px-5 pb-3 pt-4"><h2 className="text-base font-semibold">{title} <span className="font-normal tabular-nums text-muted-foreground">{items.length}</span></h2><span className="text-[0.8125rem] text-muted-foreground">{sub}</span></div>
      <ul>{items.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-3 border-t border-zinc-100 px-5 py-3 text-sm">
          <UserAvatar name={c.name || "?"} color={c.logoColor} url={c.logoUrl} className="size-8 rounded-lg text-[0.6875rem]" />
          <span className="flex min-w-0 flex-1 flex-col"><span className="flex items-center gap-2 font-medium">{c.name || "Unnamed"}<KindChip c={c} /></span><span className="truncate text-[0.8125rem] text-muted-foreground">{render(c)}</span></span>
        </li>
      ))}</ul>
    </section>
  );
}

