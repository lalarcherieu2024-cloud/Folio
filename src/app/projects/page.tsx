import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { getSession } from "@/lib/auth";
import { getAllSkills, getApplications, getOpenProjects } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

export const metadata = { title: "Find projects · Folio" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const skill = typeof sp.skill === "string" ? sp.skill : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const user = await getSession();
  const [projects, skills, mine] = await Promise.all([getOpenProjects({ q, skill, category }), getAllSkills(), user ? getApplications(user) : []]);
  const applied = new Set(mine.map((a) => a.projectId));
  const href = (next: { skill?: string; category?: string }) => {
    const p = new URLSearchParams();
    const c = "category" in next ? next.category : category, s = "skill" in next ? next.skill : skill;
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    if (s) p.set("skill", s);
    return `/projects${p.size ? `?${p}` : ""}`;
  };
  const chip = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-blue bg-blue-soft font-bold text-blue" : "border-line bg-surface text-muted hover:text-ink"}`;

  return (
    <>
      <h1 className="text-4xl">Find projects</h1>
      <p className="mb-6 mt-2 max-w-[60ch] text-muted">Paid projects from startups, small businesses and fellow students, in every field. Fixed price, clear finish line.</p>
      <form className="mb-4 flex flex-wrap items-center gap-2.5" role="search">
        <input name="q" defaultValue={q} type="search" aria-label="Search projects" placeholder="Search by skill, company or task" className="input min-w-[220px] flex-1" />
        {category && <input type="hidden" name="category" value={category} />}
        {skill && <input type="hidden" name="skill" value={skill} />}
        <button className="btn btn-quiet">Search</button>
      </form>
      <div className="mb-3 flex flex-wrap gap-2" aria-label="Category">
        <Link href={href({ category: "" })} className={chip(!category)}>All fields</Link>
        {CATEGORIES.map((c) => <Link key={c} href={href({ category: category === c ? "" : c })} aria-pressed={category === c} className={chip(category === c)}>{c}</Link>)}
      </div>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="Skill">
        {skills.map((s) => <Link key={s} href={href({ skill: skill === s ? "" : s })} aria-pressed={skill === s} className={`${chip(skill === s)} !py-0.5 !text-[.8rem]`}>{s}</Link>)}
      </div>
      {projects.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">{projects.map((p) => <ProjectCard key={p.id} p={p} applied={applied.has(p.id)} />)}</div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-line p-8 text-center text-muted">No projects match. Clear a filter, or <Link href="/projects/new" className="font-semibold text-blue">request help with your own idea</Link>.</div>
      )}
    </>
  );
}
