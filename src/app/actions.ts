"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { createApplication, createProject, createUser, findUserByEmail, setCv, updateProfile } from "@/lib/data";
import { CATEGORIES, type Category } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean };
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Only allow same-site relative redirects after sign-in.
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/projects");

export async function signUpAction(_: FormState, f: FormData): Promise<FormState> {
  const fullName = str(f, "fullName"), email = str(f, "email").toLowerCase(), program = str(f, "program");
  if (!fullName) return { error: "Enter your name." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email." };
  if (str(f, "password").length < 8) return { error: "Use a password of at least 8 characters." };
  const user = await createUser({ email, fullName, program });
  if ("error" in user) return { error: user.error };
  await startSession(user.id);
  redirect("/profile?welcome=1");
}

export async function signInAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await findUserByEmail(str(f, "email"));
  if (!user) return { error: "No account with that email. Create one first." };
  await startSession(user.id);
  redirect(safeNext(str(f, "next")));
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}

export async function applyAction(_: FormState, f: FormData): Promise<FormState> {
  const projectId = str(f, "projectId");
  const user = await requireUser(`/projects/${projectId}`);
  const { error } = await createApplication(user, projectId, str(f, "pitch"));
  if (error) return { error };
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/applications");
  return { ok: true };
}

export async function updateProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/profile");
  const github = str(f, "github").replace(/^@/, "");
  const linkedin = str(f, "linkedin");
  if (github && !/^[a-zA-Z0-9-]{1,39}$/.test(github)) return { error: "That doesn't look like a GitHub username." };
  if (linkedin && !/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(linkedin)) return { error: "Paste your full LinkedIn profile link (https://www.linkedin.com/in/...)." };
  await updateProfile(user, { fullName: str(f, "fullName") || user.fullName, program: str(f, "program"), githubHandle: github || null, linkedinUrl: linkedin || null });
  revalidatePath("/profile");
  return { ok: true };
}

const CV_TYPES = new Set([".pdf", ".doc", ".docx"]);

export async function uploadCvAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/profile");
  const file = f.get("cv");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  const ext = path.extname(file.name).toLowerCase();
  if (!CV_TYPES.has(ext)) return { error: "Upload a PDF or Word document." };
  if (file.size > 5 * 1024 * 1024) return { error: "The file must be under 5 MB." };
  // Dev-only storage on local disk (git-ignored). Phase 3: Supabase Storage, private bucket.
  const dir = path.join(process.cwd(), ".data", "cv");
  await mkdir(dir, { recursive: true });
  const safe = `${Date.now()}-${user.id.replace(/[^a-z0-9]/gi, "_")}${ext}`;
  await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
  await setCv(user, { fileName: file.name.slice(0, 120), sizeKb: Math.max(1, Math.round(file.size / 1024)), uploadedAt: new Date().toISOString() });
  revalidatePath("/profile");
  return { ok: true };
}

export async function postProjectAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/projects/new");
  const title = str(f, "title"), summary = str(f, "summary"), doneWhen = str(f, "doneWhen");
  const deliverables = str(f, "deliverables").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const category = str(f, "category") as Category;
  const priceEur = Number(f.get("priceEur")), weeks = Number(f.get("weeks"));
  if (!title || !summary || !doneWhen || deliverables.length === 0) return { error: "Fill in the title, problem, deliverables and how you'll know it's done." };
  if (!CATEGORIES.includes(category)) return { error: "Pick a category." };
  if (!(priceEur >= 150)) return { error: "Set a price of at least €150." };
  if (!(weeks >= 1 && weeks <= 6)) return { error: "Duration must be 1 to 6 weeks." };
  const skills = str(f, "skills").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5);
  const p = await createProject(user, { title, summary, doneWhen, deliverables, category, priceEur: Math.round(priceEur), weeks, skills });
  revalidatePath("/projects");
  redirect(`/projects/${p.id}?posted=1`);
}
