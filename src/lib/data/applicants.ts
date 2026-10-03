// Reviewing applicants on a project you posted. Used by the student "request" page today and
// by the company side later (a company reviews applicants exactly the same way).
import { createClient } from "../supabase/server";
import type { Applicant, Project, StudentProfile } from "../types";
import { avatarPublicUrl } from "../avatar";
import { UUID, toProject } from "./shared";

/** A project the signed-in user posted (any status), or undefined. */
export async function getOwnedProject(user: StudentProfile, id: string): Promise<Project | undefined> {
  if (!UUID.test(id)) return undefined;
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("*").eq("id", id).eq("client_id", user.id).maybeSingle();
  return data ? toProject(data) : undefined;
}

const HOUR = 60 * 60;

export async function getApplicants(project: Project): Promise<Applicant[]> {
  const supabase = await createClient();
  const { data: apps } = await supabase.from("applications").select("*").eq("project_id", project.id).order("created_at", { ascending: true });
  if (!apps?.length) return [];
  const ids = apps.map((a) => a.student_id);
  const [{ data: profiles }, { data: files }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_color, avatar_path, program, github_handle, github_verified, linkedin_url, linkedin_verified, cv_path, cv_name, cv_size_kb, strengths").in("id", ids),
    supabase.from("profile_files").select("id, user_id, path, name, size_kb").in("user_id", ids).order("created_at", { ascending: false }),
  ]);
  const signed = async (path: string | null | undefined) => (path ? (await supabase.storage.from("cvs").createSignedUrl(path, HOUR)).data?.signedUrl ?? null : null);

  const out = await Promise.all(apps.map(async (a): Promise<Applicant> => {
    const p = (profiles ?? []).find((x) => x.id === a.student_id);
    const theirSkills = new Set(((p?.strengths?.skills ?? []) as { label: string; pct: number }[]).filter((s) => s.pct >= 50).map((s) => s.label.toLowerCase()));
    const shared = a.include_files ? (files ?? []).filter((f) => f.user_id === a.student_id) : [];
    return {
      applicationId: a.id, status: a.status, pitch: a.pitch ?? "", includeFiles: !!a.include_files, appliedAt: a.created_at,
      student: {
        id: a.student_id, avatarColor: p?.avatar_color ?? null, avatarUrl: avatarPublicUrl(p?.avatar_path), fullName: p?.full_name ?? "Student", program: p?.program ?? "", githubHandle: p?.github_handle ?? null, githubVerified: !!p?.github_verified,
        linkedinUrl: p?.linkedin_url ?? null, linkedinVerified: !!p?.linkedin_verified, topField: (p?.strengths?.fields?.[0]?.label as string | undefined) ?? null,
      },
      cv: p?.cv_name ? { name: p.cv_name, sizeKb: p.cv_size_kb ?? 0, url: await signed(p.cv_path) } : null,
      files: await Promise.all(shared.map(async (f) => ({ id: f.id, name: f.name, sizeKb: f.size_kb, url: await signed(f.path) }))),
      matchedSkills: project.skills.filter((s) => theirSkills.has(s.toLowerCase())),
    };
  }));
  // Best skill match first; ties keep first-come order.
  return out.sort((x, y) => y.matchedSkills.length - x.matchedSkills.length);
}

export async function acceptApplicant(applicationId: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_applicant", { p_application_id: applicationId });
  if (error) {
    console.error("acceptApplicant", error);
    if (/no longer open/i.test(error.message)) return { error: "This project already has someone working on it." };
    if (/not your project/i.test(error.message)) return { error: "Only the person who posted it can choose." };
    return { error: "Couldn't accept this applicant. Has migration 0009 been run?" };
  }
  return {};
}

export async function declineApplicant(applicationId: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").update({ status: "declined" }).eq("id", applicationId).eq("status", "pending").select("id");
  if (error) { console.error("declineApplicant", error); return { error: "Couldn't decline. Try again." }; }
  return data?.length ? {} : { error: "That application can't be declined anymore." };
}
