// Student-side data: applications, credentials, profile, CV, recommendations.
// Owner: student interface.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "../supabase/server";
import { analyzeCv } from "../strengths";
import type { Application, Credential, Project, ProfileFile, StudentProfile } from "../types";
import { UUID, monthYear, toApplication, toProject } from "./shared";
import { countUnreadMessages } from "./messages";
import { appliedProjectIds, getOpenProjects, notOwnedBy } from "./projects";

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

export async function createApplication(user: StudentProfile, projectId: string, pitch: string, includeFiles: boolean): Promise<{ error?: string }> {
  if (!UUID.test(projectId)) return { error: "This project is no longer open." };
  if (!user.cv) return { error: "Add your CV to your profile before applying." };
  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({ project_id: projectId, student_id: user.id, pitch: pitch.trim().slice(0, 600), include_files: includeFiles && user.fileCount > 0 });
  if (!error) return {};
  if (error.code === "23505") return { error: "You already applied." };
  if (error.code === "42501") return { error: "You can't apply to this project. It may be closed, it may be your own, or your CV is missing (if this keeps happening, migration 0011 may not have been run)." };
  console.error("createApplication", error);
  return { error: "Couldn't send your application. Try again." };
}

export type NewProject = Pick<Project, "title" | "category" | "summary" | "deliverables" | "doneWhen" | "priceEur" | "weeks" | "skills" | "hoursPerWeek" | "learn" | "beginnerFriendly">;

export async function createProject(user: StudentProfile, p: NewProject): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").insert({
    client_id: user.id, client_name: user.fullName, hood: "IE community", category: p.category, title: p.title.slice(0, 70),
    summary: p.summary, deliverables: p.deliverables, done_when: p.doneWhen, price_eur: p.priceEur, weeks: p.weeks, skills: p.skills,
    hours_per_week: p.hoursPerWeek, learn: p.learn, beginner_friendly: p.beginnerFriendly,
  }).select("id").single();
  if (error) { console.error("createProject", error); return { error: "Couldn't post your request. Check the fields and try again." }; }
  return { id: data.id };
}

export type PayKind = "paid" | "escrow" | "review";
export type PaymentRow = { projectId: string; title: string; org: string; amount: number; kind: PayKind; date: string };
export type Payments = { rows: PaymentRow[]; earned: number; escrow: number; review: number; paidCount: number; months: { label: string; value: number }[] };

// Built from the student's real accepted/delivered/verified work. The money itself moves with the
// payments phase (Stripe); until then these are the agreed project prices and their stage.
export async function getPayments(user: StudentProfile): Promise<Payments> {
  const supabase = await createClient();
  const { data: apps } = await supabase.from("applications").select("*").eq("student_id", user.id).in("status", ["accepted", "delivered"]);
  const ids = (apps ?? []).map((a) => a.project_id);
  const [{ data: projects }, { data: creds }] = await Promise.all([
    ids.length ? supabase.from("project_cards").select("*").in("id", ids) : Promise.resolve({ data: [] as any[] }),
    supabase.from("credential_cards").select("project_id, issued_at").eq("student_id", user.id),
  ]);
  const paidAt = new Map((creds ?? []).map((c) => [c.project_id as string, c.issued_at as string]));
  const rows: PaymentRow[] = (apps ?? []).flatMap((a) => {
    const p = (projects ?? []).find((x) => x.id === a.project_id);
    if (!p) return [];
    const paid = paidAt.has(p.id);
    const kind: PayKind = paid ? "paid" : a.status === "delivered" ? "review" : "escrow";
    const date = paid ? new Date(paidAt.get(p.id)!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : kind === "review" ? "After client sign-off" : `Est. ${p.weeks} wk${p.weeks > 1 ? "s" : ""} from start`;
    return [{ projectId: p.id, title: p.title, org: p.org_name ?? p.client_name, amount: p.price_eur, kind, date }];
  }).sort((x, y) => Number(y.kind === "paid") - Number(x.kind === "paid") || 0);
  const sum = (k: PayKind) => rows.filter((r) => r.kind === k).reduce((n, r) => n + r.amount, 0);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const value = rows.filter((r) => r.kind === "paid").reduce((n, r) => {
      const at = new Date(paidAt.get(r.projectId)!);
      return at.getFullYear() === d.getFullYear() && at.getMonth() === d.getMonth() ? n + r.amount : n;
    }, 0);
    return { label: d.toLocaleDateString("en-GB", { month: "short" }), value };
  });
  return { rows, earned: sum("paid"), escrow: sum("escrow"), review: sum("review"), paidCount: rows.filter((r) => r.kind === "paid").length, months };
}

// Edits an OPEN request you posted. Applicants (pending) are notified by the database function.
// Returns how many were notified. Fails once someone has been accepted.
export async function updateProject(user: StudentProfile, id: string, p: NewProject): Promise<{ notified?: number; error?: string }> {
  if (!UUID.test(id)) return { error: "Request not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_project", {
    p_id: id, p_title: p.title.slice(0, 70), p_category: p.category, p_summary: p.summary, p_deliverables: p.deliverables,
    p_done_when: p.doneWhen, p_price: p.priceEur, p_weeks: p.weeks, p_skills: p.skills,
    p_hours: p.hoursPerWeek, p_learn: p.learn, p_beginner: p.beginnerFriendly,
  });
  if (error) {
    console.error("updateProject", error);
    if (/no longer be edited/i.test(error.message)) return { error: "Someone is already working on this, so it can't be edited anymore." };
    if (/not your project/i.test(error.message)) return { error: "Only the person who posted it can edit it." };
    return { error: "Couldn't save your changes. Has migration 0010 been run?" };
  }
  void user;
  return { notified: Number(data ?? 0) };
}

export async function getCredentials(user: StudentProfile): Promise<Credential[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("credential_cards").select("*").eq("student_id", user.id).order("issued_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id, projectId: r.project_id, projectTitle: r.project_title, clientName: r.client_name, orgName: r.org_name,
    hood: r.hood, rating: r.rating, review: r.review, issuedAt: monthYear(r.issued_at), category: r.category ?? "", priceEur: r.price_eur ?? 0,
  }));
}

export async function updateProfile(user: StudentProfile, patch: { fullName: string; program: string; payoutLink?: string | null; githubHandle?: string | null; linkedinUrl?: string | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    full_name: patch.fullName, program: patch.program,
    ...(patch.payoutLink !== undefined ? { payout_link: patch.payoutLink } : {}),
    ...(patch.linkedinUrl !== undefined ? { linkedin_url: patch.linkedinUrl } : {}),
    ...(patch.githubHandle !== undefined && !user.githubVerified ? { github_handle: patch.githubHandle } : {}), // a verified handle comes from GitHub itself
  }).eq("id", user.id);
  return error ? { error: "Couldn't save your profile." } : {};
}

export async function getStudentNavCounts(user: StudentProfile): Promise<{ open: number; mine: number; messages: number }> {
  const supabase = await createClient();
  const [open, mine, messages] = await Promise.all([
    (async () => {
      const applied = await appliedProjectIds(user.id);
      let q = supabase.from("project_cards").select("id", { count: "exact", head: true }).eq("status", "open").or(notOwnedBy(user.id));
      if (applied.length) q = q.not("id", "in", `(${applied.join(",")})`);
      return q;
    })(),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("student_id", user.id),
    countUnreadMessages(user),
  ]);
  return { open: open.count ?? 0, mine: mine.count ?? 0, messages };
}

export async function getRecommended(user: StudentProfile, applied: Application[] & { project?: Project }[]): Promise<{ projects: Project[]; basedOn: string[] }> {
  const open = await getOpenProjects({ viewerId: user.id });
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
  const { data, error } = await supabase.from("applications").delete().eq("id", applicationId).eq("student_id", user.id).in("status", ["pending", "interview"]).select("id");
  if (error) { console.error("withdrawApplication", error); return { error: "Couldn't withdraw. Try again." }; }
  return data?.length ? {} : { error: "Only applications that haven't been decided can be withdrawn." };
}

/** One of the student's own applications with its project (for the application page). */
export async function getApplicationDetail(user: StudentProfile, applicationId: string): Promise<(Application & { project: Project }) | null> {
  if (!UUID.test(applicationId)) return null;
  const supabase = await createClient();
  const { data: a } = await supabase.from("applications").select("*").eq("id", applicationId).eq("student_id", user.id).maybeSingle();
  if (!a) return null;
  const { data: p } = await supabase.from("project_cards").select("*").eq("id", a.project_id).maybeSingle();
  return p ? { ...toApplication(a), project: toProject(p) } : null;
}

/** The student confirms they'll attend the interview (tells the client; migration 0017). */
export async function confirmInterview(applicationId: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_interview", { app_id: applicationId });
  if (!error) return {};
  if (error.code === "P0001") return { error: error.message };
  console.error("confirmInterview", error);
  return { error: error.code === "PGRST202" ? "Interviews need migration 0017. Run it in the Supabase SQL Editor." : "Couldn't confirm. Try again." };
}

// Deletes the CV from storage and clears everything derived from it (the strengths scores).
// Applications already sent stay, but clients reviewing them will see "no CV on file".
export async function deleteCv(user: StudentProfile): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("cv_path").eq("id", user.id).single();
  if (!p?.cv_path) return { error: "There's no CV to delete." };
  const { error } = await supabase.from("profiles").update({ cv_path: null, cv_name: null, cv_size_kb: null, cv_uploaded_at: null, strengths: null }).eq("id", user.id);
  if (error) { console.error("deleteCv", error); return { error: "Couldn't delete your CV. Try again." }; }
  await supabase.storage.from("cvs").remove([p.cv_path]);
  return {};
}

// Scores the CV already on file (for CVs uploaded before scoring existed, or when it failed).
export async function reanalyzeStoredCv(user: StudentProfile): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("cv_path, cv_name").eq("id", user.id).single();
  if (!p?.cv_path) return { error: "Upload a CV first." };
  if (!/\.pdf$/i.test(p.cv_name ?? p.cv_path)) return { error: "Only PDF CVs can be scored. Upload a PDF version." };
  const { data: file, error } = await supabase.storage.from("cvs").download(p.cv_path);
  if (error || !file) return { error: "Couldn't open your CV file." };
  try {
    const strengths = await analyzeCv(await file.arrayBuffer(), "application/pdf");
    if (!strengths) return { error: "AI scoring isn't switched on (no Gemini key)." };
    const { error: saveErr } = await supabase.from("profiles").update({ strengths }).eq("id", user.id);
    if (saveErr) { console.error("reanalyzeStoredCv save", saveErr); return { error: "Couldn't save your strengths. Has migration 0004 been run?" }; }
    return {};
  } catch (err) {
    console.error("reanalyzeStoredCv", err);
    return { error: "Scoring failed. Try again in a moment." };
  }
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


// ---- Additional files (portfolio PDF, work samples)
export const MAX_EXTRA_FILES = 5;

export async function getProfileFiles(user: StudentProfile): Promise<ProfileFile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile_files").select("id, name, size_kb, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  return (data ?? []).map((f) => ({ id: f.id, name: f.name, sizeKb: f.size_kb, createdAt: f.created_at }));
}

export async function addProfileFile(user: StudentProfile, file: File, ext: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { count, error: countErr } = await supabase.from("profile_files").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countErr) return { error: "Additional files aren't set up yet (run migration 0008)." };
  if ((count ?? 0) >= MAX_EXTRA_FILES) return { error: `You can add up to ${MAX_EXTRA_FILES} files. Remove one first.` };
  const path = `${user.id}/extra-${Date.now()}${ext}`;
  const { error: upErr } = await supabase.storage.from("cvs").upload(path, await file.arrayBuffer(), { contentType: file.type || undefined });
  if (upErr) { console.error("addProfileFile upload", upErr); return { error: "Upload failed. Try again." }; }
  const { error } = await supabase.from("profile_files").insert({ user_id: user.id, path, name: file.name.slice(0, 120), size_kb: Math.max(1, Math.round(file.size / 1024)) });
  if (error) { await supabase.storage.from("cvs").remove([path]); console.error("addProfileFile insert", error); return { error: "Couldn't save the file." }; }
  return {};
}

export async function removeProfileFile(user: StudentProfile, id: string): Promise<{ error?: string }> {
  if (!UUID.test(id)) return { error: "File not found." };
  const supabase = await createClient();
  const { data: row } = await supabase.from("profile_files").select("path").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!row) return { error: "File not found." };
  await supabase.storage.from("cvs").remove([row.path]);
  const { error } = await supabase.from("profile_files").delete().eq("id", id).eq("user_id", user.id);
  return error ? { error: "Couldn't remove the file." } : {};
}

// ---- Saved projects (the heart)
export async function getSavedIds(user: StudentProfile): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("saved_projects").select("project_id").eq("user_id", user.id).order("created_at", { ascending: false });
  return (data ?? []).map((r) => r.project_id as string);
}

export async function toggleSaved(user: StudentProfile, projectId: string, save: boolean): Promise<{ error?: string }> {
  if (!UUID.test(projectId)) return { error: "Project not found." };
  const supabase = await createClient();
  const { error } = save
    ? await supabase.from("saved_projects").upsert({ user_id: user.id, project_id: projectId }, { onConflict: "user_id,project_id", ignoreDuplicates: true })
    : await supabase.from("saved_projects").delete().eq("user_id", user.id).eq("project_id", projectId);
  if (error) { console.error("toggleSaved", error); return { error: "Couldn't update your saved projects. Has migration 0012 been run?" }; }
  return {};
}

// Real events that count as activity: applications sent, projects accepted, credentials earned.
export async function getActivityDates(user: StudentProfile): Promise<string[]> {
  const supabase = await createClient();
  const [{ data: apps }, { data: creds }] = await Promise.all([
    supabase.from("applications").select("created_at, accepted_at").eq("student_id", user.id),
    supabase.from("credentials").select("issued_at").eq("student_id", user.id),
  ]);
  return [
    ...(apps ?? []).flatMap((a) => [a.created_at, a.accepted_at].filter(Boolean) as string[]),
    ...(creds ?? []).map((c) => c.issued_at as string),
  ];
}

// ---- Profile picture: a colour for the initials, or an uploaded photo
export async function setAvatarColor(user: StudentProfile, color: string | null): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_color: color }).eq("id", user.id);
  if (error) { console.error("setAvatarColor", error); return { error: "Couldn't save your colour. Has migration 0014 been run?" }; }
  return {};
}

export async function saveAvatar(user: StudentProfile, file: File): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (upErr) { console.error("saveAvatar upload", upErr); return { error: "Upload failed. Has migration 0014 been run?" }; }
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (error) { await supabase.storage.from("avatars").remove([path]); return { error: "Couldn't save your photo." }; }
  if (old?.avatar_path) await supabase.storage.from("avatars").remove([old.avatar_path]);
  return {};
}

export async function removeAvatar(user: StudentProfile): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
  if (error) return { error: "Couldn't remove your photo." };
  if (old?.avatar_path) await supabase.storage.from("avatars").remove([old.avatar_path]);
  return {};
}
