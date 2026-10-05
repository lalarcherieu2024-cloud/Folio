"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { addBriefFile, removeBriefFile, requestChanges, submitWork, type NewFile } from "@/lib/data/submissions";
import { BRIEF_EXTENSIONS, extOf, MAX_BRIEF_FILES, MAX_SUBMISSION_FILES } from "@/lib/files";
import { str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const refresh = () => { revalidatePath("/applications", "layout"); revalidatePath("/company", "layout"); };

// Files were already uploaded straight to storage from the browser (folder = the user's id).
// These actions only record them, after checking the paths really are inside the caller's own folder.
const ownFiles = (userId: string, files: NewFile[]) => files.every((f) => typeof f.path === "string" && f.path.startsWith(`${userId}/`) && !f.path.includes(".."));

export async function submitWorkAction(applicationId: string, note: string, files: NewFile[]): Promise<FormState> {
  const user = await requireUser("/applications", "student");
  if (!Array.isArray(files) || files.length === 0) return { error: "Add at least one file." };
  if (files.length > MAX_SUBMISSION_FILES) return { error: `Add up to ${MAX_SUBMISSION_FILES} files.` };
  if (!ownFiles(user.id, files)) return { error: "Something went wrong with the upload. Try again." };
  const res = await submitWork(applicationId, String(note ?? "").slice(0, 1000), files);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function requestChangesAction(_: FormState, f: FormData): Promise<FormState> {
  await requireUser("/company/applicants", "company");
  const res = await requestChanges(str(f, "applicationId"), str(f, "feedback").slice(0, 1500));
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function addBriefFileAction(projectId: string, file: NewFile): Promise<FormState> {
  const user = await requireUser("/company/projects");
  if (!ownFiles(user.id, [file])) return { error: "Something went wrong with the upload. Try again." };
  if (!(BRIEF_EXTENSIONS as readonly string[]).includes(extOf(file.name))) return { error: "Use a PDF or an image (PNG, JPG, WebP) so students can preview it." };
  const supabase = await createClient();
  const { count } = await supabase.from("project_files").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  if ((count ?? 0) >= MAX_BRIEF_FILES) {
    await supabase.storage.from("project-files").remove([file.path]);
    return { error: `You can attach up to ${MAX_BRIEF_FILES} files. Remove one first.` };
  }
  const res = await addBriefFile(user, projectId, file);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function removeBriefFileAction(id: string): Promise<FormState> {
  await requireUser("/company/projects");
  await removeBriefFile(id);
  refresh();
  return { ok: true };
}
