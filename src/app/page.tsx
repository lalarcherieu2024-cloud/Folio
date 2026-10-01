import Link from "next/link";
import { Plaque } from "@/components/Plaque";
import { Reveal } from "@/components/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { getOpenProjects } from "@/lib/data";
import { SAMPLE_CREDENTIALS } from "@/lib/mock-data";
import { CATEGORIES } from "@/lib/types";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const [user, projects] = await Promise.all([getSession(), getOpenProjects()]);
  return (
    <>
      <section className="grid items-center gap-12 pb-12 pt-4 md:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="mb-3 inline-block rounded-full bg-blue-soft px-3 py-1 text-sm font-bold text-blue">For IE students</p>
          <h1 className="text-[clamp(2.4rem,6vw,4rem)] leading-[1.04]">Real projects. Real pay. Real proof.</h1>
          <p className="my-5 max-w-[52ch] text-lg text-muted">
            Take paid projects from startups, small businesses and fellow students, in any field, not only tech. Every finished project becomes a credential the client signs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={user ? "/projects" : "/signup"} className="btn">{user ? "Browse projects" : "Create your account"}</Link>
            {!user && <Link href="/how-it-works" className="btn btn-quiet">How it works</Link>}
          </div>
        </div>
        <div className="grid max-w-md gap-5">
          {SAMPLE_CREDENTIALS.map((c, i) => (
            <div key={c.id} className={i === 0 ? "-rotate-1" : "rotate-1 md:translate-x-6"}><div className={i === 0 ? "float" : "float-slow"}><Plaque c={c} /></div></div>
          ))}
        </div>
      </section>

      <section className="pb-12">
        <h2 className="mb-4 text-2xl">Projects in every field</h2>
        <div className="stagger flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/projects?category=${encodeURIComponent(c)}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold lift hover:border-blue hover:text-blue">{c}</Link>
          ))}
        </div>
      </section>

      <section className="pb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl">Open now</h2>
          <Link href="/projects" className="font-semibold text-blue">See all {projects.length} →</Link>
        </div>
        <div className="stagger grid gap-4 md:grid-cols-3">{projects.slice(0, 3).map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Reveal from="left" className="lift rounded-xl border-2 border-blue bg-blue-soft p-7">
          <h3 className="mb-2 text-xl">Do projects</h3>
          <p className="mb-4 text-muted">Upload your CV, apply with a short pitch, deliver, get paid and collect verified credentials.</p>
          <Link href="/projects" className="btn">Find a project</Link>
        </Reveal>
        <Reveal from="right" delay={120} className="lift rounded-xl border-2 border-line bg-surface p-7">
          <h3 className="mb-2 text-xl">Get help on your own idea</h3>
          <p className="mb-4 text-muted">Building something? Describe it and our AI turns it into a clear brief with deliverables, then another student picks it up.</p>
          <Link href="/projects/new" className="btn btn-quiet">Request help</Link>
        </Reveal>
      </section>
    </>
  );
}
