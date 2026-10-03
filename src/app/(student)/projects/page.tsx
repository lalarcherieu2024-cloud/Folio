import { Heart, Layers, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProjectCard, kindLabel } from "@/components/shared/ProjectCard";
import { PublicWrap } from "@/components/shared/PublicWrap";
import { FieldFilters } from "@/components/student/FieldFilters";
import { QuickMatch } from "@/components/student/QuickMatch";
import { SortSelect } from "@/components/student/SortSelect";
import { getSession } from "@/lib/auth";
import { getCategoryCounts, getOpenProjects, type Sort } from "@/lib/data/projects";
import { getApplications, getSavedIds } from "@/lib/data/student";
import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur, viewerFrom, weeksLabel } from "@/lib/work";

export const metadata = { title: "Find projects · Folio" };
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const q = one(sp.q), category = one(sp.category), kind = one(sp.kind), sortRaw = one(sp.sort), view = (["list", "match"].includes(one(sp.view)) ? one(sp.view) : "grid") as "grid" | "list" | "match", projectId = one(sp.project);
  if (projectId) redirect(`/projects/${projectId}`);
  const sort = (["new", "pay", "short", "open"].includes(sortRaw) ? sortRaw : "new") as Sort;
  const kindVal = kind === "company" || kind === "student" ? kind : undefined;

  const user = await getSession();
  const savedIds = user ? await getSavedIds(user) : [];
  const savedOnly = one(sp.saved) === "1" && !!user;
  const [projects, counts, mine] = await Promise.all([
    getOpenProjects({ q, category, kind: kindVal, sort, viewerId: user?.id, onlyIds: savedOnly ? savedIds : undefined }), getCategoryCounts(user?.id), user ? getApplications(user) : [],
  ]);
  const applied = new Map(mine.map((a) => [a.projectId, a]));
  const viewer = viewerFrom(user, savedIds);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const href = (over: Record<string, string | undefined>) => {
    const next: Record<string, string> = { ...(q && { q }), ...(category && { category }), ...(kindVal && { kind: kindVal }), ...(sort !== "new" && { sort }), ...(view !== "grid" && { view }), ...(savedOnly && { saved: "1" }) };
    for (const [k, v] of Object.entries(over)) { if (v) next[k] = v; else delete next[k]; }
    const s = new URLSearchParams(next).toString();
    return `/projects${s ? `?${s}` : ""}`;
  };
  const hasFilters = !!(q || category || kindVal || savedOnly);

  return (
    <PublicWrap signedIn={!!user}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Find projects</h1>
          <p className="max-w-[60ch] text-[0.9375rem] text-muted-foreground">Paid work from startups, small businesses and fellow students. Fixed price, clear finish line.</p>
        </div>

        <div className="flex flex-wrap items-start gap-8">
          <aside className="flex max-w-60 flex-[1_1_12.5rem] flex-col gap-5">
            <FieldFilters
              fields={[
                { key: "all", label: "All fields", count: total, href: href({ category: undefined }), active: !category },
                ...CATEGORIES.map((c) => ({ key: c, label: c, count: counts[c] ?? 0, href: href({ category: category === c ? undefined : c }), active: category === c })),
              ]}
              kinds={([["", "Anyone"], ["company", "Companies"], ["student", "Students"]] as const).map(([k, label]) => ({ key: k || "any", label, href: href({ kind: k || undefined }), active: (kindVal ?? "") === k }))}
            />
          </aside>

          <section className="flex min-w-0 flex-[999_1_30rem] flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">{projects.length}</span> project{projects.length === 1 ? "" : "s"}{q ? <> matching “{q}”</> : null}</span>
              {hasFilters && <Link href="/projects" className="inline-flex h-8 items-center rounded-md px-2.5 text-[0.8125rem] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Clear filters</Link>}
              {user && (
                <Link href={href({ saved: savedOnly ? undefined : "1" })} scroll={false} aria-pressed={savedOnly} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[0.8125rem] font-medium", savedOnly ? "border-[#e11d48]/40 bg-[#fff1f2] text-[#be123c]" : "bg-white text-zinc-600 hover:bg-muted")}>
                  <Heart className={cn("size-3.5", savedOnly && "fill-[#e11d48] text-[#e11d48]")} />Saved <span className="font-mono text-xs">{savedIds.length}</span>
                </Link>
              )}
              <div className="flex rounded-md border bg-white p-0.5" role="group" aria-label="Layout">
                <Link href={href({ view: undefined })} scroll={false} aria-label="Grid view" aria-pressed={view === "grid"} className={cn("grid size-7 place-items-center rounded", view === "grid" && "bg-muted")}><LayoutGrid className="size-3.5" /></Link>
                <Link href={href({ view: "list" })} scroll={false} aria-label="List view" aria-pressed={view === "list"} className={cn("grid size-7 place-items-center rounded", view === "list" && "bg-muted")}><List className="size-3.5" /></Link>
                {user && <Link href={href({ view: "match" })} scroll={false} aria-label="Quick match" title="Quick match" aria-pressed={view === "match"} className={cn("grid size-7 place-items-center rounded", view === "match" && "bg-muted")}><Layers className="size-3.5" /></Link>}
              </div>
              <Suspense fallback={null}><SortSelect value={sort} /></Suspense>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
                <span className="text-base font-semibold">{savedOnly ? "Nothing saved yet" : "No projects match"}</span>
                <span className="text-muted-foreground">{savedOnly ? "Tap the heart on a project to keep it on your shortlist." : "Clear a filter, or post your own idea and another student picks it up."}</span>
                <div className="flex gap-2">
                  <Link href="/projects" className="inline-flex h-9 items-center rounded-md border bg-white px-3.5 text-sm font-medium hover:bg-muted">Clear filters</Link>
                  <Link href="/projects/new" className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Post a project</Link>
                </div>
              </div>
            ) : view === "match" ? (
              <QuickMatch projects={[...projects].filter((p) => !savedIds.includes(p.id)).sort((a, b) => b.skills.filter((s) => viewer.skills.includes(s.toLowerCase())).length - a.skills.filter((s) => viewer.skills.includes(s.toLowerCase())).length)} viewer={viewer} />
            ) : view === "grid" ? (
              <div key={`${category}|${kindVal}|${sort}|${q}|${savedOnly}`} className="stagger grid grid-cols-[repeat(auto-fill,minmax(min(100%,17.5rem),1fr))] gap-4">
                {projects.map((p) => <ProjectCard key={p.id} p={p} applied={applied.has(p.id)} href={`/projects/${p.id}`} viewer={viewer} />)}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white">
                <div className="hidden grid-cols-[minmax(0,1fr)_8.75rem_5.625rem_5.625rem_5.625rem] gap-4 border-b bg-panel px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid"><span>Project</span><span>Field</span><span>Pay</span><span>Duration</span><span>Applicants</span></div>
                {projects.map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} scroll={false} className="grid items-center gap-x-4 gap-y-1 border-b border-zinc-100 px-4 py-3.5 text-sm last:border-0 hover:bg-panel md:grid-cols-[minmax(0,1fr)_8.75rem_5.625rem_5.625rem_5.625rem]">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2 font-medium">{p.title}{applied.has(p.id) && <Badge className="h-5 rounded-md px-1.5 text-[0.6875rem]">Applied</Badge>}</span>
                      <span className="text-[0.8125rem] text-muted-foreground">{p.orgName ?? p.clientName} · {kindLabel(p)}</span>
                    </div>
                    <span className="text-[0.8125rem] text-zinc-600">{p.category}</span>
                    <span className="font-mono font-semibold">{eur(p.priceEur)}</span>
                    <span className="text-zinc-600">{weeksLabel(p.weeks)}</span>
                    <span className="font-mono text-zinc-600">{p.applicantCount}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PublicWrap>
  );
}

