"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createApplication, createProject, saveCv, updateProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean; notice?: string };
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Only allow same-site relative redirects after sign-in.
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/projects");

export async function signUpAction(_: FormState, f: FormData): Promise<FormState> {
  const fullName = str(f, "fullName"), email = str(f, "email").toLowerCase(), program = str(f, "program");
  if (!fullName) return { error: "Enter your name." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email." };
  if (str(f, "password").length < 8) return { error: "Use a password of at least 8 characters." };
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password: str(f, "password"),
    options: { data: { full_name: fullName, program }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) return { error: "An account with this email already exists. Sign in instead." };
    if (error.code === "email_address_invalid") return { error: "That email address isn't accepted. Use a real email address you can open." };
    if (error.code === "weak_password") return { error: "That password is too weak. Try a longer one." };
    console.error("signUp", error);
    if (/database error saving new user/i.test(error.message)) return { error: "The database rejected this sign-up. If you're the developer, run supabase/migrations/0002_open_signup.sql in the Supabase SQL Editor." };
    if (error.code === "over_email_send_rate_limit") return { error: "Too many sign-up emails right now. Wait a few minutes and try again." };
    return { error: "Couldn't create your account. Try again in a moment." };
  }
  // With "Confirm email" on, there's no session until the link is clicked.
  if (!data.session) return { ok: true, notice: `Check ${email} for a confirmation link, then sign in.` };
  redirect("/profile?welcome=1");
}

export async function signInAction(_: FormState, f: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(f, "email").toLowerCase(), password: str(f, "password") });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Confirm your email first: check your inbox for the link." };
    return { error: "Wrong email or password." };
  }
  redirect(safeNext(str(f, "next")));
}

export async function signOutAction() {
  await (await createClient()).auth.signOut();
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
  const res = await updateProfile(user, { fullName: str(f, "fullName") || user.fullName, program: str(f, "program"), githubHandle: github || null, linkedinUrl: linkedin || null });
  if (res.error) return res;
  revalidatePath("/", "layout");
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
  const res = await saveCv(user, file, ext);
  if (res.error) return res;
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
  const res = await createProject(user, { title, summary, doneWhen, deliverables, category, priceEur: Math.round(priceEur), weeks, skills });
  if (res.error) return { error: res.error };
  revalidatePath("/projects");
  redirect(`/projects/${res.id}?posted=1`);
}
