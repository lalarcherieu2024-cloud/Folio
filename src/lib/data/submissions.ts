// Submitting work, reviewing it, and brief files. Rules live in supabase/migrations/0019_submissions.sql.
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import type { StudentProfile } from "../types";
import { UUID } from "./shared";

export type SubmissionStatus = "submitted" | "changes_requested" | "accepted";
export type FileRef = { id: string; fileName: string; sizeKb: number };
export type Submission = {
  id: string;
  round: number;
  note: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  files: FileRef[];
};
export type NewFile = { path: string; name: string; sizeKb: number };

const NEEDS_MIGRATION = "The database is missing the submission features. Run supabase/migrations/0019_submissions.sql in the Supabase SQL Editor.";

function rpcError(error: PostgrestError, fallback: string) {
  if (error.code === "P0001") return error.message; // written for people inside the database functions
  if (error.code === "PGRST202" || error.code === "42883" || error.code === "42P01" || error.code === "PGRST205") return NEEDS_MIGRATION;
  console.error(fallback, error);
  return fallback;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toSubmission = (r: any): Submission => ({
  id: r.id, round: r.round, note: r.note, status: r.status, feedback: r.feedback, submittedAt: r.submitted_at, reviewedAt: r.reviewed_at,
  files: (r.files ?? []).map((f: any) => ({ id: f.id, fileName: f.file_name, sizeKb: f.size_kb })),
});

/** Every round of one application, oldest first. Row-level security limits this to the student and the client. */
export async function getSubmissions(applicationId: string): Promise<Submission[]> {
  if (!UUID.test(applicationId)) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("submissions").select("*, files:submission_files(id, file_name, size_kb)").eq("application_id", applicationId).order("round");
  return (data ?? []).map(toSubmission);
}

/** The most recent round for each of these applications (for the "My work" list). */
export async function getLatestSubmissions(applicationIds: string[]): Promise<Record<string, Submission>> {
  if (applicationIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("submissions").select("*, files:submission_files(id, file_name, size_kb)").in("application_id", applicationIds).order("round");
  const out: Record<string, Submission> = {};
  for (const r of data ?? []) out[(r as any).application_id] = toSubmission(r); // ascending, so the last one wins
  return out;
}

export async function submitWork(applicationId: string, note: string, files: NewFile[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_work", {
    p_app: applicationId, p_note: note, p_files: files.map((f) => ({ path: f.path, name: f.name, size_kb: f.sizeKb })),
  });
  return error ? { error: rpcError(error, "Couldn't submit your work. Try again.") } : {};
}

export async function requestChanges(applicationId: string, feedback: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_changes", { p_app: applicationId, p_feedback: feedback });
  return error ? { error: rpcError(error, "Couldn't send your feedback. Try again.") } : {};
}

// ---------------------------------------------------------------- brief files

export async function getBriefFiles(projectId: string): Promise<FileRef[]> {
  if (!UUID.test(projectId)) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("project_files").select("id, file_name, size_kb").eq("project_id", projectId).order("uploaded_at");
  return (data ?? []).map((f: any) => ({ id: f.id, fileName: f.file_name, sizeKb: f.size_kb }));
}

export async function addBriefFile(user: StudentProfile, projectId: string, f: NewFile): Promise<{ error?: string }> {
  if (!UUID.test(projectId)) return { error: "Project not found." };
  const supabase = await createClient();
  const { error } = await supabase.from("project_files").insert({ project_id: projectId, path: f.path, file_name: f.name.slice(0, 120), size_kb: Math.max(1, f.sizeKb) });
  if (error) {
    await supabase.storage.from("project-files").remove([f.path]);
    return { error: rpcError(error, "Couldn't save the file. Try again.") };
  }
  return {};
}

export async function removeBriefFile(id: string): Promise<{ error?: string }> {
  if (!UUID.test(id)) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("project_files").delete().eq("id", id).select("path");
  if (data?.length) await supabase.storage.from("project-files").remove(data.map((d: any) => d.path));
  return {};
}
