import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/ApplyForm";
import { ClientLine, eur } from "@/components/ProjectCard";
import { getSession } from "@/lib/auth";
import { FEE_RATE, getApplicationFor, getProject } from "@/lib/data";

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const p = await getProject(id);
  if (!p) notFound();
  const user = await getSession();
  const mine = user ? await getApplicationFor(user, p.id) : undefined;
  const isOwner = !!user && p.postedById === user.id;

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/projects" className="text-sm font-semibold text-blue">← All projects</Link>
      {sp.posted && <p className="mt-4 rounded-lg bg-green-soft p-3 font-semibold text-green">Your request is live. Students can now apply.</p>}
      <p className="mt-4 text-sm text-muted"><ClientLine p={p} /></p>
      <h1 className="mt-1 text-4xl leading-tight">{p.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 tabular-nums">
        <span className="text-xl font-extrabold">{eur(p.priceEur)}</span>
        <span>{p.weeks} week{p.weeks > 1 ? "s" : ""}</span>
        <span className="rounded border border-line bg-surface px-2 py-0.5 text-[.8rem] font-semibold">{p.category}</span>
        {p.skills.map((s) => <span key={s} className="rounded border border-line bg-surface px-2 py-0.5 text-[.8rem] text-muted">{s}</span>)}
      </div>
      <dl className="stagger my-6 grid gap-5">
        <div><dt className="font-bold">The problem</dt><dd className="mt-0.5 text-muted">{p.summary}</dd></div>
        <div><dt className="font-bold">What you&apos;ll deliver</dt><dd><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{p.deliverables.map((d) => <li key={d}>{d}</li>)}</ul></dd></div>
        <div><dt className="font-bold">Done when</dt><dd className="mt-0.5 text-muted">{p.doneWhen}</dd></div>
      </dl>
      <p className="mb-6 rounded-lg bg-blue-soft p-3 text-sm">You receive the full {eur(p.priceEur)}. The client pays a {Math.round(FEE_RATE * 100)}% Folio fee on top.</p>

      {isOwner ? (
        <p className="rounded-lg border border-line bg-surface p-4 font-semibold">This is your request. {p.applicantCount} applicant{p.applicantCount === 1 ? "" : "s"} so far. Choosing a student arrives with the next phase.</p>
      ) : mine ? (
        <p className="rounded-lg bg-amber-soft p-4 font-semibold text-amber-ink">You applied to this project. Status: {mine.status}.</p>
      ) : !user ? (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="mb-3 font-semibold">Create an account to apply.</p>
          <div className="flex gap-2"><Link href="/signup" className="btn">Create account</Link><Link href={`/signin?next=/projects/${p.id}`} className="btn btn-quiet">Sign in</Link></div>
        </div>
      ) : (
        user.cv ? (
          <ApplyForm projectId={p.id} price={eur(p.priceEur)} />
        ) : (
          <div className="rounded-xl border-2 border-blue bg-blue-soft p-5">
            <p className="font-bold">Add your CV to apply</p>
            <p className="mb-3 mt-1 text-muted">Every application needs a CV so clients can see your background. It takes a minute.</p>
            <Link href="/profile" className="btn">Upload my CV</Link>
          </div>
        )
      )}
    </article>
  );
}
