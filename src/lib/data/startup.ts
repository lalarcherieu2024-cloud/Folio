// Startup / SME data. Owner: startup interface.
// Database rules: supabase/migrations/0001_init.sql, the Student-view migrations 0009–0013
// (accept_applicant, applicant file access) and 0015_company_side.sql.
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import type { ApplicationStatus, Category, Credential, Project, ProjectStatus, StudentProfile } from "../types";
import { monthYear, toProject, UUID } from "./shared";

export type CompanyProject = Project & { createdAt: string };

export type Applicant = {
  id: string; // application id
  projectId: string;
  projectTitle: string;
  projectStatus: ProjectStatus;
  studentId: string;
  name: string;
  program: string;
  status: ApplicationStatus;
  createdAt: string;
  hasCv: boolean;
  linkCount: number;
  pastCount: number; // verified Folio credentials
  avgRating: number | null;
};

export type ApplicantDetail = Applicant & {
  pitch: string;
  uniEmailVerified: boolean;
  cv: { fileName: string; sizeKb: number } | null;
  links: { label: string; href: string }[];
  past: Credential[];
};

export type OrgStatus = "draft" | "pending" | "verified" | "rejected";
export const DOC_KINDS = ["registry_extract", "representative_id", "bank_certificate"] as const;
export type DocKind = (typeof DOC_KINDS)[number];
export type CompanyDoc = { kind: DocKind; fileName: string; sizeKb: number };

export type Organization = {
  id: string;
  name: string; // legal name
  cif: string;
  website: string;
  hood: string; // "Malasaña, Madrid"
  about: string; // organizations.blurb
  founded: string; // year, e.g. "2024"
  teamSize: string; // organizations.size, e.g. "11–50 employees"
  status: OrgStatus;
  reviewNote: string | null;
  docs: CompanyDoc[];
};

export type OrgDetails = Pick<Organization, "name" | "cif" | "website" | "hood" | "about" | "founded" | "teamSize">;

/* eslint-disable @typescript-eslint/no-explicit-any */
const toCompanyProject = (r: any): CompanyProject => ({ ...toProject(r), createdAt: r.created_at });

const NEEDS_MIGRATION = "The database is missing the company features. Run supabase/migrations/0015_company_side.sql in the Supabase SQL Editor.";

// Errors raised inside the database functions are written for people, so pass them through.
function rpcError(error: PostgrestError, fallback: string) {
  if (error.code === "P0001") return error.message;
  if (error.code === "PGRST202" || error.code === "42883") return NEEDS_MIGRATION;
  console.error(fallback, error);
  return fallback;
}

// ---------------------------------------------------------------- organization + verification

/** The signed-in company's organization with its uploaded documents, or null before step 3 of sign-up. */
export async function getOrganization(user: StudentProfile): Promise<Organization | null> {
  const supabase = await createClient();
  const { data: o } = await supabase.from("organizations").select("*").eq("owner_id", user.id).maybeSingle();
  if (!o) return null;
  const { data: docs } = await supabase.from("company_documents").select("kind, file_name, size_kb").eq("org_id", o.id);
  return {
    id: o.id, name: o.name ?? "", cif: o.cif ?? "", website: o.website ?? "", hood: o.hood ?? "", about: o.blurb ?? "",
    founded: o.founded ?? "", teamSize: o.size ?? "", status: (o.status as OrgStatus) ?? (o.verified ? "verified" : "draft"),
    reviewNote: o.review_note ?? null,
    docs: (docs ?? []).map((d: any) => ({ kind: d.kind, fileName: d.file_name, sizeKb: d.size_kb })),
  };
}

export async function saveOrganization(user: StudentProfile, d: OrgDetails): Promise<{ error?: string }> {
  const supabase = await createClient();
  const row = { name: d.name, cif: d.cif, website: d.website, hood: d.hood, blurb: d.about, founded: d.founded || null, size: d.teamSize || null };
  const { data: existing } = await supabase.from("organizations").select("id").eq("owner_id", user.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("organizations").update(row).eq("id", existing.id)
    : await supabase.from("organizations").insert({ ...row, owner_id: user.id });
  if (!error) return {};
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "42703" || error.code === "PGRST204") return { error: NEEDS_MIGRATION };
  console.error("saveOrganization", error);
  return { error: "Couldn't save your company details. Try again." };
}

export async function saveCompanyDoc(user: StudentProfile, kind: DocKind, file: File, ext: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id, status").eq("owner_id", user.id).maybeSingle();
  if (!org) return { error: "Add your company details first." };
  if (org.status !== "draft" && org.status !== "rejected") return { error: "Your documents were already submitted." };
  const path = `${user.id}/${kind}-${Date.now()}${ext}`;
  const { error: upErr } = await supabase.storage.from("company-docs").upload(path, await file.arrayBuffer(), { contentType: file.type || undefined });
  if (upErr) { console.error("saveCompanyDoc upload", upErr); return { error: "Upload failed. Check the file is a PDF, JPG or PNG under 10 MB." }; }
  const { data: old } = await supabase.from("company_documents").select("path").eq("org_id", org.id).eq("kind", kind).maybeSingle();
  if (old) await supabase.from("company_documents").delete().eq("org_id", org.id).eq("kind", kind);
  const { error } = await supabase.from("company_documents").insert({ org_id: org.id, kind, path, file_name: file.name.slice(0, 120), size_kb: Math.max(1, Math.round(file.size / 1024)) });
  if (error) { console.error("saveCompanyDoc", error); await supabase.storage.from("company-docs").remove([path]); return { error: "Couldn't save the document. Try again." }; }
  if (old?.path) await supabase.storage.from("company-docs").remove([old.path]);
  return {};
}

export async function removeCompanyDoc(user: StudentProfile, kind: DocKind): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("owner_id", user.id).maybeSingle();
  if (!org) return {};
  const { data } = await supabase.from("company_documents").delete().eq("org_id", org.id).eq("kind", kind).select("path");
  if (!data?.length) return { error: "Documents can't be changed after you submit them." };
  await supabase.storage.from("company-docs").remove(data.map((d: any) => d.path));
  return {};
}

export async function submitVerification(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_company_verification");
  return error ? { error: rpcError(error, "Couldn't submit. Try again.") } : {};
}

// ---------------------------------------------------------------- projects

/** Projects this company/user posted (projects.client_id = the signed-in user), newest first. */
export async function getCompanyProjects(user: StudentProfile): Promise<CompanyProject[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
  return (data ?? []).map(toCompanyProject);
}

/** One of this company's own projects, or null if it doesn't exist or belongs to someone else. */
export async function getCompanyProject(user: StudentProfile, id: string): Promise<CompanyProject | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("project_cards").select("*").eq("id", id).eq("client_id", user.id).maybeSingle();
  return data ? toCompanyProject(data) : null;
}

export type NewCompanyProject = { title: string; summary: string; deliverable: string; category: Category; priceEur: number; weeks: number; skills: string[] };

/** Posts a project under the company's verified organization (its name and badge show on the card). */
export async function createCompanyProject(user: StudentProfile, org: Organization, p: NewCompanyProject): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").insert({
    client_id: user.id, client_name: org.name, org_id: org.id, hood: org.hood || "Madrid", category: p.category, title: p.title.slice(0, 70),
    summary: p.summary, deliverables: [p.deliverable], done_when: p.deliverable, price_eur: p.priceEur, weeks: p.weeks, skills: p.skills,
  }).select("id").single();
  if (error) { console.error("createCompanyProject", error); return { error: error.code === "42501" ? "Your company needs to be verified before you can post." : "Couldn't post your project. Check the fields and try again." }; }
  return { id: data.id };
}

/** How many verified credentials this company has issued (for the profile). */
export async function countIssuedCredentials(projects: CompanyProject[]): Promise<number> {
  if (projects.length === 0) return 0;
  const supabase = await createClient();
  const { count } = await supabase.from("credentials").select("id", { count: "exact", head: true }).in("project_id", projects.map((p) => p.id));
  return count ?? 0;
}

// ---------------------------------------------------------------- applicants

const APPLICANT_FIELDS = "id, project_id, student_id, status, created_at, pitch, student:profiles(full_name, program, uni_email_verified, github_handle, linkedin_url, cv_path, cv_name, cv_size_kb)";

const linksOf = (s: any): { label: string; href: string }[] => [
  ...(s?.github_handle ? [{ label: `github.com/${s.github_handle}`, href: `https://github.com/${s.github_handle}` }] : []),
  ...(s?.linkedin_url ? [{ label: String(s.linkedin_url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: s.linkedin_url }] : []),
];

function toApplicant(a: any, project: Pick<Project, "title" | "status">, ratings: number[]): Applicant {
  return {
    id: a.id, projectId: a.project_id, projectTitle: project.title, projectStatus: project.status, studentId: a.student_id,
    name: a.student?.full_name ?? "Student", program: a.student?.program ?? "", status: a.status, createdAt: a.created_at,
    hasCv: !!a.student?.cv_path, linkCount: linksOf(a.student).length,
    pastCount: ratings.length, avgRating: ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : null,
  };
}

/** Everyone who applied to these projects, newest first, with their name and Folio track record. */
export async function getCompanyApplicants(projects: CompanyProject[]): Promise<Applicant[]> {
  if (projects.length === 0) return [];
  const supabase = await createClient();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const { data: apps } = await supabase.from("applications").select(APPLICANT_FIELDS).in("project_id", [...byId.keys()]).order("created_at", { ascending: false });
  if (!apps?.length) return [];
  const { data: creds } = await supabase.from("credentials").select("student_id, rating").in("student_id", [...new Set(apps.map((a: any) => a.student_id))]);
  const ratings = new Map<string, number[]>();
  for (const c of creds ?? []) ratings.set(c.student_id, [...(ratings.get(c.student_id) ?? []), c.rating]);
  return apps.flatMap((a: any) => (byId.has(a.project_id) ? [toApplicant(a, byId.get(a.project_id)!, ratings.get(a.student_id) ?? [])] : []));
}

/** One application to one of this company's projects, with the student's CV, links and past credentials. */
export async function getApplicant(user: StudentProfile, applicationId: string): Promise<ApplicantDetail | null> {
  if (!UUID.test(applicationId)) return null;
  const supabase = await createClient();
  const { data: a } = await supabase.from("applications").select(APPLICANT_FIELDS).eq("id", applicationId).maybeSingle();
  if (!a) return null;
  const project = await getCompanyProject(user, a.project_id);
  if (!project) return null;
  const { data: creds } = await supabase.from("credential_cards").select("*").eq("student_id", a.student_id).order("issued_at", { ascending: false });
  const past: Credential[] = (creds ?? []).map((r: any) => ({
    id: r.id, projectId: r.project_id, projectTitle: r.project_title, clientName: r.client_name, orgName: r.org_name,
    hood: r.hood, rating: r.rating, review: r.review, issuedAt: monthYear(r.issued_at),
  }));
  const s = (a as any).student;
  return {
    ...toApplicant(a, project, past.map((c) => c.rating)),
    pitch: a.pitch, uniEmailVerified: !!s?.uni_email_verified,
    cv: s?.cv_path ? { fileName: s.cv_name ?? "CV", sizeKb: s.cv_size_kb ?? 0 } : null,
    links: linksOf(s), past,
  };
}

/** A short-lived link to an applicant's CV (allowed by the 0009 "owners read applicant files" rule). */
export async function getApplicantCvUrl(user: StudentProfile, applicationId: string): Promise<string | null> {
  if (!UUID.test(applicationId)) return null;
  const supabase = await createClient();
  const { data: a } = await supabase.from("applications").select("project_id, student:profiles(cv_path)").eq("id", applicationId).maybeSingle();
  const path = (a as any)?.student?.cv_path;
  if (!a || !path || !(await getCompanyProject(user, a.project_id))) return null;
  const { data } = await supabase.storage.from("cvs").createSignedUrl(path, 60 * 5);
  return data?.signedUrl ?? null;
}

/** Accept one applicant (accept_applicant() also declines the rest and starts the project).
 *  Returns how many others on that project were declined. */
export async function acceptApplicant(applicationId: string): Promise<{ declined?: number; error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { data: app } = await supabase.from("applications").select("project_id").eq("id", applicationId).maybeSingle();
  if (!app) return { error: "Application not found." };
  const { count } = await supabase.from("applications").select("id", { count: "exact", head: true })
    .eq("project_id", app.project_id).eq("status", "pending").neq("id", applicationId);
  const { error } = await supabase.rpc("accept_applicant", { p_application_id: applicationId });
  return error ? { error: rpcError(error, "Couldn't accept this applicant. Try again.") } : { declined: count ?? 0 };
}

export async function declineApplicant(applicationId: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("applications").update({ status: "declined" }).eq("id", applicationId).eq("status", "pending").select("id");
  if (error) { console.error("declineApplicant", error); return { error: "Couldn't reject this applicant. Try again." }; }
  return data?.length ? {} : { error: "You already decided on this applicant." };
}

/** Confirms delivered work: issues the student's verified credential and completes the project. */
export async function verifyDelivery(applicationId: string, rating: number, review: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Application not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("verify_delivery", { app_id: applicationId, stars: rating, review_text: review });
  return error ? { error: rpcError(error, "Couldn't verify the delivery. Try again.") } : {};
}

/** Counts for the company sidebar. */
export async function getCompanyNavCounts(user: StudentProfile): Promise<{ projects: number; applicants: number }> {
  const projects = await getCompanyProjects(user);
  return { projects: projects.length, applicants: projects.reduce((n, p) => n + p.applicantCount, 0) };
}

// TODO (startup builder): payments (Stripe) once delivery verification is in use.
