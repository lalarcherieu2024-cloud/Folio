import Link from "next/link";
import { eur } from "@/components/ProjectCard";
import { requireUser } from "@/lib/auth";
import { getApplications, getProjectsPostedBy } from "@/lib/data";
import type { Application, Project } from "@/lib/types";

export const metadata = { title: "My applications · Folio" };

function label(a: Application, p: Project): [string, string] {
  if (a.status === "declined") return ["Not selected", "border border-line bg-bg text-muted"];
  if (a.status === "accepted" && p.status === "verified") return ["Verified", "bg-green-soft text-green"];
  if (a.status === "accepted") return ["In progress", "bg-amber-soft text-amber-ink"];
  return ["Waiting for client", "bg-amber-soft text-amber-ink"];
}

export default async function ApplicationsPage() {
  const user = await requireUser("/applications");
  const [apps, posted] = await Promise.all([getApplications(user), getProjectsPostedBy(user)]);
  return (
    <>
      <h1 className="text-4xl">My applications</h1>
      <p className="mb-6 mt-2 text-muted">Track each project from application to verified credential.</p>
      {apps.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line p-8 text-center text-muted">
          You haven&apos;t applied to anything yet.<br />
          <Link href="/projects" className="btn mt-3">Find a project</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((a) => {
            const [text, cls] = label(a, a.project);
            return (
              <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line bg-surface p-5">
                <div>
                  <h3 className="text-lg"><Link href={`/projects/${a.project.id}`}>{a.project.title}</Link></h3>
                  <p className="text-sm text-muted">{a.project.orgName ?? a.project.clientName}, {eur(a.project.priceEur)}, {a.project.weeks} week{a.project.weeks > 1 ? "s" : ""}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[.78rem] font-bold ${cls}`}>{text}</span>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-12 text-2xl">My requests</h2>
      {posted.length === 0 ? (
        <p className="text-muted">Projects you post for other students show up here. <Link href="/projects/new" className="font-semibold text-blue">Request help</Link></p>
      ) : (
        <div className="flex flex-col gap-3">
          {posted.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5 hover:border-blue">
              <span className="font-serif text-lg font-semibold">{p.title}</span>
              <span className="text-sm text-muted">{p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"} · {eur(p.priceEur)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
