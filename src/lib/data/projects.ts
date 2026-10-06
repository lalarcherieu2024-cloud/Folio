// Public marketplace reads (what anyone can browse). Used by the landing page,
// the student side and the startup side. Owner: whoever changes browse/search.
import { createClient } from "../supabase/server";
import type { Project } from "../types";
import { UUID, toProject } from "./shared";

export type Sort = "new" | "pay" | "short" | "open";
export type ProjectFilter = { q?: string; skill?: string; category?: string; sort?: Sort; viewerId?: string; onlyIds?: string[] };

// Keeps projects with no owner (demo companies) while dropping the signed-in user's own.
export const notOwnedBy = (id: string) => `client_id.is.null,client_id.neq.${id}`;

// Projects the viewer has already applied to leave the browse list (they live under "My work").
export async function appliedProjectIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("applications").select("project_id").eq("student_id", userId);
  return (data ?? []).map((a) => a.project_id as string);
}

// Browse only shows what the viewer can still act on: not their own, not already applied to.
export function hideViewersOwn<T extends { or: (f: string) => T; not: (c: string, op: string, v: string) => T }>(query: T, viewerId: string | undefined, applied: string[]): T {
  if (!viewerId) return query;
  const q = query.or(notOwnedBy(viewerId));
  return applied.length ? q.not("id", "in", `(${applied.join(",")})`) : q;
}

export async function getOpenProjects(f: ProjectFilter = {}): Promise<Project[]> {
  const supabase = await createClient();
  if (f.onlyIds && f.onlyIds.length === 0) return [];
  let query = supabase.from("project_cards").select("*").eq("status", "open");
  query = f.sort === "pay" ? query.order("price_eur", { ascending: false })
    : f.sort === "short" ? query.order("weeks", { ascending: true })
    : f.sort === "open" ? query.order("applicant_count", { ascending: true })
    : query.order("created_at", { ascending: false });
  query = hideViewersOwn(query, f.viewerId, f.viewerId ? await appliedProjectIds(f.viewerId) : []);
  if (f.onlyIds) query = query.in("id", f.onlyIds);
  query = query.not("org_id", "is", null); // only companies post projects
  if (f.category) query = query.eq("category", f.category);
  if (f.skill) query = query.contains("skills", [f.skill]);
  const q = f.q?.trim().replace(/[,()%*\\]/g, " ");
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,org_name.ilike.%${q}%,client_name.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(`getOpenProjects: ${error.message}`);
  return (data ?? []).map(toProject);
}

export async function getAllSkills(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("skills").eq("status", "open");
  return [...new Set((data ?? []).flatMap((r) => r.skills as string[]))].sort();
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (!UUID.test(id)) return undefined;
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("*").eq("id", id).maybeSingle();
  return data ? toProject(data) : undefined;
}

export async function getCategoryCounts(viewerId?: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  let query = supabase.from("project_cards").select("category").eq("status", "open");
  query = hideViewersOwn(query, viewerId, viewerId ? await appliedProjectIds(viewerId) : []);
  const { data } = await query;
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.category] = (counts[r.category] ?? 0) + 1;
  return counts;
}

// Open projects ranked by skill overlap with the student's CV strengths and past applications.
