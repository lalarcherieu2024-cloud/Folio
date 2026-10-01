// The ONLY file the UI reads data from. Every function is a Supabase query; row-level
// security in supabase/migrations/0001_init.sql decides what each signed-in user may see.
import { createClient } from "./supabase/server";
import type { Application, Credential, Project, StudentProfile } from "./types";

export const FEE_RATE = 0.15;
export type ProjectFilter = { q?: string; skill?: string; category?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProject = (r: any): Project => ({
  id: r.id, postedById: r.client_id, clientName: r.client_name, clientKind: r.org_id ? "company" : "student",
  orgName: r.org_name, orgVerified: r.org_verified, hood: r.hood, category: r.category, title: r.title,
  summary: r.summary, deliverables: r.deliverables, doneWhen: r.done_when, priceEur: r.price_eur,
  weeks: r.weeks, skills: r.skills, status: r.status, applicantCount: r.applicant_count,
});
const toApplication = (r: any): Application => ({ id: r.id, projectId: r.project_id, pitch: r.pitch, status: r.status });
const monthYear = (iso: string) => new Date(iso).toLocaleString("en-GB", { month: "long", year: "numeric" });

export async function getOpenProjects(f: ProjectFilter = {}): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase.from("project_cards").select("*").eq("status", "open").order("created_at", { ascending: false });
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

export async function getApplicationFor(user: StudentProfile, projectId: string): Promise<Application | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from("applications").select("*").eq("project_id", projectId).eq("student_id", user.id).maybeSingle();
  return data ? toApplication(data) : undefined;
}

export async function getApplications(user: StudentProfile): Promise<(Application & { project: Project })[]> {
  const supabase = await createClient();
  const { data: apps } = await supabase.from("applications").select("*").eq("student_id", user.id).order("created_at", { ascending: false });
  if (!apps?.length) return [];
  const { data: projects } = await supabase.from("project_cards").select("*").in("id", apps.map((a) => a.project_id));
  const byId = new Map((projects ?? []).map((p) => [p.id, toProject(p)]));
  return apps.flatMap((a) => (byId.has(a.project_id) ? [{ ...toApplication(a), project: byId.get(a.project_id)! }] : []));
}

export async function getProjectsPostedBy(user: StudentProfile): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
  return (data ?? []).map(toProject);
}

export async function createApplication(user: StudentProfile, projectId: string, pitch: string): Promise<{ error?: string }> {
  if (!UUID.test(projectId)) return { error: "This project is no longer open." };
  if (!user.cv) return { error: "Add your CV to your profile before applying." };
  if (pitch.trim().length < 20) return { error: "Write at least a couple of sentences." };
  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({ project_id: projectId, student_id: user.id, pitch: pitch.trim() });
  if (!error) return {};
  if (error.code === "23505") return { error: "You already applied." };
  if (error.code === "42501") return { error: "You can't apply to this project. It may be closed, it may be your own, or your CV is missing." };
  console.error("createApplication", error);
  return { error: "Couldn't send your application. Try again." };
}

export type NewProject = Pick<Project, "title" | "category" | "summary" | "deliverables" | "doneWhen" | "priceEur" | "weeks" | "skills">;

export async function createProject(user: StudentProfile, p: NewProject): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").insert({
    client_id: user.id, client_name: user.fullName, hood: "IE community", category: p.category, title: p.title.slice(0, 70),
    summary: p.summary, deliverables: p.deliverables, done_when: p.doneWhen, price_eur: p.priceEur, weeks: p.weeks, skills: p.skills,
  }).select("id").single();
  if (error) { console.error("createProject", error); return { error: "Couldn't post your request. Check the fields and try again." }; }
  return { id: data.id };
}

export async function getCredentials(user: StudentProfile): Promise<Credential[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("credential_cards").select("*").eq("student_id", user.id).order("issued_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id, projectId: r.project_id, projectTitle: r.project_title, clientName: r.client_name, orgName: r.org_name,
    hood: r.hood, rating: r.rating, review: r.review, issuedAt: monthYear(r.issued_at),
  }));
}

export async function updateProfile(user: StudentProfile, patch: { fullName: string; program: string; githubHandle: string | null; linkedinUrl: string | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    full_name: patch.fullName, program: patch.program, github_handle: patch.githubHandle, linkedin_url: patch.linkedinUrl,
  }).eq("id", user.id);
  return error ? { error: "Couldn't save your profile." } : {};
}

export async function saveCv(user: StudentProfile, file: File, ext: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const path = `${user.id}/cv-${Date.now()}${ext}`;
  const { error: upErr } = await supabase.storage.from("cvs").upload(path, await file.arrayBuffer(), { contentType: file.type || undefined });
  if (upErr) { console.error("saveCv upload", upErr); return { error: "Upload failed. Try again." }; }
  const { data: old } = await supabase.from("profiles").select("cv_path").eq("id", user.id).single();
  const { error } = await supabase.from("profiles").update({
    cv_path: path, cv_name: file.name.slice(0, 120), cv_size_kb: Math.max(1, Math.round(file.size / 1024)), cv_uploaded_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) return { error: "Couldn't save your CV." };
  if (old?.cv_path) await supabase.storage.from("cvs").remove([old.cv_path]);
  return {};
}
