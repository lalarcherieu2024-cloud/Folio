// Startup / SME data. Owner: startup interface.
// Everything here is a stub for the startup builder to fill in. The database rules (RLS)
// that already allow it live in supabase/migrations/0001_init.sql; anything new goes in a
// new numbered migration owned by the startup builder.
import { createClient } from "../supabase/server";
import type { Project, StudentProfile } from "../types";
import { toProject } from "./shared";

/** Projects this company/user posted (works today: projects.client_id = the signed-in user). */
export async function getCompanyProjects(user: StudentProfile): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
  return (data ?? []).map(toProject);
}

/** Counts for the company sidebar. */
export async function getCompanyNavCounts(user: StudentProfile): Promise<{ projects: number; applicants: number }> {
  const projects = await getCompanyProjects(user);
  return { projects: projects.length, applicants: projects.reduce((n, p) => n + p.applicantCount, 0) };
}

// TODO (startup builder):
//  - getApplicantsFor(projectId): applications on a project the company owns, with the student's
//    profile, CV link (signed URL from the private "cvs" bucket) and strengths.
//  - acceptApplicant(applicationId): accept one, decline the rest, set project status to in_progress
//    (one transaction -> a Postgres function, not several client calls).
//  - verifyDelivery(projectId, rating, review): creates the credential. Credentials have NO insert
//    policy on purpose, so this must be a security-definer function that checks the caller owns the project.
//  - Organization verification (CIF, company email, LinkedIn): organizations.verified is admin-only.
//  - Payments (Stripe) last.
