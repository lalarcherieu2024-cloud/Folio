import Link from "next/link";
import type { Project } from "@/lib/types";

export const eur = (n: number) => "€" + n.toLocaleString("en-GB");

export function ClientLine({ p }: { p: Project }) {
  return (
    <>
      <strong className="text-ink">{p.orgName ?? p.clientName}</strong>{" "}
      {p.clientKind === "student" ? "· student" : `· ${p.hood}`}
      {p.orgName && p.orgVerified && <span className="ml-1.5 font-semibold text-green">✓ verified</span>}
    </>
  );
}

export function ProjectCard({ p, applied }: { p: Project; applied?: boolean }) {
  return (
    <Link href={`/projects/${p.id}`} className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-5 lift hover:border-blue">
      <span className="flex items-center justify-between gap-2 text-sm text-muted">
        <span><ClientLine p={p} /></span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[.72rem] font-bold ${p.clientKind === "student" ? "bg-blue-soft text-blue" : "bg-amber-soft text-amber-ink"}`}>
          {p.clientKind === "student" ? "Student request" : "Company"}
        </span>
      </span>
      <h3 className="text-lg leading-tight">{p.title}</h3>
      <span className="text-[.95rem] text-muted">{p.summary}</span>
      <span className="flex flex-wrap gap-1.5">
        <span className="rounded border border-line bg-bg px-2 py-0.5 text-[.78rem] font-semibold">{p.category}</span>
        {p.skills.map((s) => <span key={s} className="rounded border border-line bg-bg px-2 py-0.5 text-[.78rem] text-muted">{s}</span>)}
      </span>
      <span className="mt-auto flex flex-wrap items-center gap-4 border-t border-dashed border-line pt-2 text-[.92rem] tabular-nums">
        <span className="font-extrabold">{eur(p.priceEur)}</span>
        <span>{p.weeks} week{p.weeks > 1 ? "s" : ""}</span>
        <span>{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"}</span>
        {applied && <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-[.78rem] font-bold text-amber-ink">Applied</span>}
      </span>
    </Link>
  );
}
