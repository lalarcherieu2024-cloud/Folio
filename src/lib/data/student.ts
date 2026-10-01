// Student-side data: applications, credentials, profile, CV, recommendations.
// Owner: student interface.
import { createClient } from "../supabase/server";
import { analyzeCv } from "../strengths";
import type { Application, Credential, Project, StudentProfile } from "../types";
import { UUID, monthYear, toApplication, toProject } from "./shared";
import { getOpenProjects } from "./projects";

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

export async function getStudentNavCounts(user: StudentProfile): Promise<{ open: number; mine: number }> {
  const supabase = await createClient();
  const [open, mine] = await Promise.all([
    supabase.from("project_cards").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("student_id", user.id),
  ]);
  return { open: open.count ?? 0, mine: mine.count ?? 0 };
}

export async function getRecommended(user: StudentProfile, applied: Application[] & { project?: Project }[]): Promise<{ projects: Project[]; basedOn: string[] }> {
  const open = await getOpenProjects();
  const mine = new Set((applied as { projectId: string }[]).map((a) => a.projectId));
  const want = new Map<string, number>();
  for (const s of user.strengths?.skills ?? []) want.set(s.label.toLowerCase(), s.pct);
  for (const a of applied as { project?: Project }[]) for (const s of a.project?.skills ?? []) want.set(s.toLowerCase(), Math.max(want.get(s.toLowerCase()) ?? 0, 60));
  const fieldPct = new Map((user.strengths?.fields ?? []).map((f) => [f.label, f.pct]));
  const score = (p: Project) => p.skills.reduce((n, s) => n + (want.get(s.toLowerCase()) ?? 0), 0) + (fieldPct.get(p.category) ?? 0) / 2;
  const candidates = open.filter((p) => !mine.has(p.id) && p.postedById !== user.id);
  const ranked = [...candidates].sort((a, b) => score(b) - score(a));
  const basedOn = [...want.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  return { projects: ranked.slice(0, 3), basedOn };
}

export async function markDelivered(user: StudentProfile, applicationId: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").update({ status: "delivered" }).eq("id", applicationId).eq("student_id", user.id).eq("status", "accepted").select("id");
  if (error) { console.error("markDelivered", error); return { error: "Couldn't mark this as delivered. Has migration 0004 been run?" }; }
  return data?.length ? {} : { error: "Only work in progress can be marked as delivered." };
}

export async function withdrawApplication(user: StudentProfile, applicationId: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").delete().eq("id", applicationId).eq("student_id", user.id).eq("status", "pending").select("id");
  if (error) { console.error("withdrawApplication", error); return { error: "Couldn't withdraw. Try again." }; }
  return data?.length ? {} : { error: "Only pending applications can be withdrawn." };
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
  // Score the CV for the "Where you're strong" card. Best-effort: never blocks the upload.
  try {
    const strengths = await analyzeCv(await file.arrayBuffer(), file.type || (ext === ".pdf" ? "application/pdf" : ""));
    await supabase.from("profiles").update({ strengths }).eq("id", user.id);
  } catch (err) {
    console.error("analyzeCv", err);
    await supabase.from("profiles").update({ strengths: null }).eq("id", user.id);
  }
  return {};
}

