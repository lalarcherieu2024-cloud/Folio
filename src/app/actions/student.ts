"use server";

// Student-side server actions. Owner: student interface.
import path from "node:path";
import { revalidatePath } from "next/cache";
import { isAvatarColor } from "@/lib/avatar";
import { requireUser } from "@/lib/auth";
import { addCertificate, addProfileFile, confirmInterview, createApplication, deleteCv, reanalyzeStoredCv, removeAvatar, removeCertificate, removeProfileFile, saveAvatar, saveCv, setAvatarColor, toggleSaved, updateProfile, withdrawApplication } from "@/lib/data/student";
import { str, type FormState } from "@/lib/form";

export async function applyAction(_: FormState, f: FormData): Promise<FormState> {
  const projectId = str(f, "projectId");
  const user = await requireUser(`/projects/${projectId}`, "student");
  // Sending the CV is mandatory; sharing extra files and writing a note are optional.
  if (f.get("includeCv") !== "on") return { error: "Tick the box to send your CV with the application." };
  const { error } = await createApplication(user, projectId, str(f, "pitch"), f.get("includeFiles") === "on");
  if (error) return { error };
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/applications");
  return { ok: true };
}

export async function updateProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  // GitHub and LinkedIn are added with the Connect buttons (so they are verified), not typed in.
  const payout = str(f, "payout");
  if (payout && !/^https:\/\/(www\.)?paypal\.(me|com)\/\S+$/i.test(payout)) return { error: "Paste your PayPal link, for example https://paypal.me/yourname." };
  const res = await updateProfile(user, { fullName: str(f, "fullName") || user.fullName, program: str(f, "program"), payoutLink: payout || null });
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}

const CV_TYPES = new Set([".pdf", ".doc", ".docx"]);

export async function uploadCvAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const file = f.get("cv");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  const ext = path.extname(file.name).toLowerCase();
  if (!CV_TYPES.has(ext)) return { error: "Upload a PDF or Word document." };
  if (file.size > 5 * 1024 * 1024) return { error: "The file must be under 5 MB." };
  const res = await saveCv(user, file, ext);
  if (res.error) return res;
  revalidatePath("/profile");
  return { ok: true };
}

export async function confirmInterviewAction(applicationId: string): Promise<FormState> {
  await requireUser("/applications", "student");
  const res = await confirmInterview(applicationId);
  if (res.error) return res;
  revalidatePath("/applications", "layout");
  revalidatePath("/home");
  return { ok: true };
}

export async function withdrawApplicationAction(applicationId: string): Promise<FormState> {
  const user = await requireUser("/applications", "student");
  const res = await withdrawApplication(user, applicationId);
  if (res.error) return res;
  revalidatePath("/applications");
  revalidatePath("/projects");
  revalidatePath("/");
  return { ok: true };
}


export async function analyzeCvAction(): Promise<FormState> {
  const user = await requireUser("/home", "student");
  const res = await reanalyzeStoredCv(user);
  if (res.error) return res;
  revalidatePath("/home");
  revalidatePath("/projects");
  return { ok: true };
}

export async function uploadExtraFileAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const file = f.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  const ext = path.extname(file.name).toLowerCase();
  if (!CV_TYPES.has(ext)) return { error: "Upload a PDF or Word document." };
  if (file.size > 5 * 1024 * 1024) return { error: "The file must be under 5 MB." };
  const res = await addProfileFile(user, file, ext);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteExtraFileAction(id: string): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const res = await removeProfileFile(user, id);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleSavedAction(projectId: string, save: boolean): Promise<FormState> {
  const user = await requireUser("/projects", "student");
  const res = await toggleSaved(user, projectId, save);
  if (res.error) return res;
  revalidatePath("/projects");
  return { ok: true };
}

export async function setAvatarColorAction(color: string | null): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  if (color !== null && !isAvatarColor(color)) return { error: "Pick one of the colours." };
  const res = await setAvatarColor(user, color);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function uploadAvatarAction(f: FormData): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const file = f.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "Use a JPG, PNG or WebP image." };
  if (file.size > 2 * 1024 * 1024) return { error: "The photo must be under 2 MB." };
  const res = await saveAvatar(user, file);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const res = await removeAvatar(user);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCvAction(): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const res = await deleteCv(user);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}


// ---- Certificates from other courses (Coursera, Programiz, …)
const CERT_TYPES: Record<string, string> = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

export async function addCertificateAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const title = str(f, "title").slice(0, 120), issuer = str(f, "issuer").slice(0, 80), issuedOn = str(f, "issuedOn");
  let credentialUrl = str(f, "credentialUrl");
  if (!title || !issuer) return { error: "Add the course name and who issued it." };
  if (issuedOn && !/^\d{4}-\d{2}$/.test(issuedOn)) return { error: "Pick the month you got it." };
  if (credentialUrl && !/^https?:\/\//i.test(credentialUrl)) credentialUrl = `https://${credentialUrl}`;
  if (credentialUrl && !/^https:\/\/[^\s]+\.[^\s]+$/i.test(credentialUrl)) return { error: "That link doesn't look right. Paste the full https:// address." };
  const raw = f.get("file");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  const ext = file ? path.extname(file.name).toLowerCase() : "";
  if (file && !CERT_TYPES[ext]) return { error: "Upload a PDF or an image (PNG, JPG, WebP)." };
  if (file && file.size > 5 * 1024 * 1024) return { error: "The file must be under 5 MB." };
  if (!file && !credentialUrl) return { error: "Add a link to the certificate or upload a copy, so clients can check it." };
  const res = await addCertificate(user, { title, issuer, issuedOn: issuedOn || null, credentialUrl: credentialUrl || null, file, ext });
  if (res.error) return res;
  revalidatePath("/", "layout"); // the profile and the home checklist
  return { ok: true };
}

export async function deleteCertificateAction(id: string): Promise<FormState> {
  const user = await requireUser("/profile", "student");
  const res = await removeCertificate(user, id);
  if (res.error) return res;
  revalidatePath("/", "layout");
  return { ok: true };
}
