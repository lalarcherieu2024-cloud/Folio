"use server";

// Messages between a company and the student it hired. Used by both sides.
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sendMessage, sendMessageWithFiles } from "@/lib/data/messages";
import type { NewFile } from "@/lib/data/submissions";
import { str, type FormState } from "@/lib/form";

export async function sendMessageAction(applicationId: string, _: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser(`/applications/${applicationId}`);
  const res = await sendMessage(user, applicationId, str(f, "body"));
  if (res.error) return res;
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath(`/company/applicants/${applicationId}`);
  return { ok: true };
}

// The files were uploaded straight to storage from the browser (folder = the sender's id); this records them.
export async function sendMessageWithFilesAction(applicationId: string, body: string, files: NewFile[]): Promise<FormState> {
  const user = await requireUser(`/applications/${applicationId}`);
  if (!Array.isArray(files) || files.length === 0 || files.length > 5) return { error: "Attach between 1 and 5 files." };
  if (!files.every((f) => typeof f.path === "string" && f.path.startsWith(`${user.id}/`) && !f.path.includes(".."))) return { error: "Something went wrong with the upload. Try again." };
  const res = await sendMessageWithFiles(applicationId, String(body ?? "").slice(0, 2000), files);
  if (res.error) return res;
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath(`/company/applicants/${applicationId}`);
  return { ok: true };
}
