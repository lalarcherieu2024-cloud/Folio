import { LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ProjectCard, kindLabel } from "@/components/shared/ProjectCard";
import { ProjectSheet, type SheetMode } from "@/components/student/ProjectSheet";
import { PublicWrap } from "@/components/shared/PublicWrap";
import { SortSelect } from "@/components/student/SortSelect";
import { getSession } from "@/lib/auth";
import { getCategoryCounts, getOpenProjects, getProject, type Sort } from "@/lib/data/projects";
import { getApplications } from "@/lib/data/student";
import { CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eur, statusInfo, weeksLabel } from "@/lib/work";

export const metadata = { title: "Find projects · Folio" };
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const q = one(sp.q), category = one(sp.category), kind = one(sp.kind), sortRaw = one(sp.sort), view = one(sp.view) === "list" ? "list" : "grid", projectId = one(sp.project);
  const sort = (["new", "pay", "short", "open"].includes(sortRaw) ? sortRaw : "new") as Sort;
  const kindVal = kind === "company" || kind === "student" ? kind : undefined;

  const user = await getSession();
  const [projects, counts, mine, selected] = await Promise.all([
    getOpenProjects({ q, category, kind: kindVal, sort }), getCategoryCounts(), user ? getApplications(user) : [], projectId ? getProject(projectId) : undefined,
  ]);
  const applied = new Map(mine.map((a) => [a.projectId, a]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const href = (over: Record<string, string | undefined>) => {
    const next: Record<string, string> = { ...(q && { q }), ...(category && { category }), ...(kindVal && { kind: kindVal }), ...(sort !== "new" && { sort }), ...(view === "list" && { view }) };
    for (const [k, v] of Object.entries(over)) { if (v) next[k] = v; else delete next[k]; }
    const s = new URLSearchParams(next).toString();
    return `/projects${s ? `?${s}` : ""}`;
  };
  const hasFilters = !!(q || category || kindVal);

  let mode: SheetMode = "signed-out"; let status: string | undefined;
  if (selected && user) {
    const a = applied.get(selected.id);
    if (selected.postedById === user.id) mode = "own";
    else if (a) { mode = "applied"; status = statusInfo(a, selected).label; }
    else mode = user.cv ? "apply" : "needs-cv";
  }

  const listItem = (active: boolean) => cn("flex h-8 items-center justify-between rounded-md px-2 text-sm transition-colors", active ? "bg-muted font-medium text-foreground" : "text-zinc-600 hover:bg-muted hover:text-foreground");
  return (
    <PublicWrap signedIn={!!user}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-semibold tracking-[-0.025em]">Find projects</h1>
          <p className="max-w-[60ch] text-[15px] text-muted-foreground">Paid work from startups, small businesses and fellow students. Fixed price, clear finish line.</p>
        </div>

        <div className="flex flex-wrap items-start gap-8">
          <aside className="flex max-w-60 flex-[1_1_200px] flex-col gap-5">
            <div className="flex flex-col gap-0.5">
              <div className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Field</div>
              <Link href={href({ category: undefined })} scroll={false} className={listItem(!category)}><span>All fields</span><span className="font-mono text-xs text-zinc-400">{total}</span></Link>
              {CATEGORIES.map((c) => (
                <Link key={c} href={href({ category: category === c ? undefined : c })} scroll={false} className={listItem(category === c)}><span>{c}</span><span className="font-mono text-xs text-zinc-400">{counts[c] ?? 0}</span></Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 px-2">
              <div className="text-xs font-medium text-muted-foreground">Posted by</div>
              {([["", "Anyone"], ["company", "Companies"], ["student", "Students"]] as const).map(([k, label]) => {
                const on = (kindVal ?? "") === k;
                return (
                  <Link key={k} href={href({ kind: k || undefined })} scroll={false} className="flex items-center gap-2 text-sm">
                    <span className={cn("grid size-4 place-items-center rounded-full border", on ? "border-primary" : "border-zinc-300")}>{on && <span className="size-2 rounded-full bg-primary" />}</span>{label}
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-[999_1_480px] flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">{projects.length}</span> project{projects.length === 1 ? "" : "s"}{q ? <> matching “{q}”</> : null}</span>
              {hasFilters && <Link href="/projects" className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Clear filters</Link>}
              <div className="flex rounded-md border bg-white p-0.5" role="group" aria-label="Layout">
                <Link href={href({ view: undefined })} scroll={false} aria-label="Grid view" aria-pressed={view === "grid"} className={cn("grid size-7 place-items-center rounded", view === "grid" && "bg-muted")}><LayoutGrid className="size-3.5" /></Link>
                <Link href={href({ view: "list" })} scroll={false} aria-label="List view" aria-pressed={view === "list"} className={cn("grid size-7 place-items-center rounded", view === "list" && "bg-muted")}><List className="size-3.5" /></Link>
              </div>
              <Suspense fallback={null}><SortSelect value={sort} /></Suspense>
            </div>

            {projects.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12">
                <span className="text-base font-semibold">No projects match</span>
                <span className="text-muted-foreground">Clear a filter, or post your own idea and another student picks it up.</span>
                <div className="flex gap-2">
                  <Link href="/projects" className="inline-flex h-9 items-center rounded-md border bg-white px-3.5 text-sm font-medium hover:bg-muted">Clear filters</Link>
                  <Link href="/projects/new" className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-zinc-700">Request help</Link>
                </div>
              </div>
            ) : view === "grid" ? (
              <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
                {projects.map((p) => <ProjectCard key={p.id} p={p} applied={applied.has(p.id)} href={href({ project: p.id })} />)}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white">
                <div className="hidden grid-cols-[minmax(0,1fr)_140px_90px_90px_90px] gap-4 border-b bg-panel px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid"><span>Project</span><span>Field</span><span>Pay</span><span>Duration</span><span>Applicants</span></div>
                {projects.map((p) => (
                  <Link key={p.id} href={href({ project: p.id })} scroll={false} className="grid items-center gap-x-4 gap-y-1 border-b border-zinc-100 px-4 py-3.5 text-sm last:border-0 hover:bg-panel md:grid-cols-[minmax(0,1fr)_140px_90px_90px_90px]">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2 font-medium">{p.title}{applied.has(p.id) && <Badge className="h-5 rounded-md px-1.5 text-[11px]">Applied</Badge>}</span>
                      <span className="text-[13px] text-muted-foreground">{p.orgName ?? p.clientName} · {kindLabel(p)}</span>
                    </div>
                    <span className="text-[13px] text-zinc-600">{p.category}</span>
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
      <Suspense fallback={null}><ProjectSheet project={selected ?? null} mode={mode} status={status} /></Suspense>
    </PublicWrap>
  );
}

