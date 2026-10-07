"use server";

// Startup / SME server actions. Owner: startup interface.
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isAvatarColor } from "@/lib/avatar";
import { createEscrow } from "@/lib/data/payments";
import { paymentsMode } from "@/lib/payments/config";
import {
  acceptApplicant, createCompanyProject, deleteProjectDraft, saveProjectDraft, declineApplicant, deleteCompanyFile, DOC_KINDS, getOrganization, inviteToInterview, removeCompanyDoc, saveFounderLinkedin,
  registerStartup, removeOrgLogo, saveCompanyDoc, saveCompanyFile, saveOrganization, saveOrgLogo, setOrgLogoColor, submitVerification, verifyDelivery,
  type DocKind, type OrgKind,
} from "@/lib/data/startup";
import { isIeEmail } from "@/lib/ie-email";
import { isStartup, STARTUP_MAX_PAY } from "@/lib/org";
import { EMAIL, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type Category } from "@/lib/types";

const refresh = () => { revalidatePath("/company", "layout"); revalidatePath("/projects"); revalidatePath("/applications"); };

// ---------------------------------------------------------------- sign-up: email code (step 2)

export async function verifyCompanyEmailAction(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase(), token = str(f, "code").replace(/\D/g, "");
  if (!EMAIL.test(email)) return { error: "Start again from Create account." };
  if (token.length !== 6) return { error: "Enter all 6 digits." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: error.code === "otp_expired" ? "That code has expired. Send a new one." : "That code isn't right. Check the email and try again." };
  redirect("/company/verify");
}

export async function resendCompanyCodeAction(email: string): Promise<FormState> {
  if (!EMAIL.test(email)) return { error: "Start again from Create account." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: email.toLowerCase() });
  if (error) return { error: error.code === "over_email_send_rate_limit" ? "Wait a minute before asking for another code." : "Couldn't send a new code. Try again." };
  return { ok: true };
}

// ---------------------------------------------------------------- company verification (one step) + profile

/** The details form's kind ("company" unless the student-startup option was picked; the profile editor sends none). */
const kindOf = (f: FormData): OrgKind | undefined => (f.has("kind") ? (str(f, "kind") === "student_startup" ? "student_startup" : "company") : undefined);

/** Company details. From the verification page it also sends them to Folio for review in the same step (migration 0032:
 *  the founder's LinkedIn is optional); from the profile page it only saves. */
export async function saveCompanyDetailsAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/company/verify", "company");
  const submitting = str(f, "then") !== "profile";
  if (submitting && f.get("agree") !== "on") return { error: "Tick the declaration at the bottom to send it for review." };
  const founderLinkedin = str(f, "founderLinkedin");
  if (submitting && founderLinkedin && !/^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/]+\/?$/i.test(founderLinkedin)) {
    return { error: "Use the link to your personal LinkedIn profile, like linkedin.com/in/your-name, or leave it empty." };
  }
  const name = str(f, "name"), cif = str(f, "cif").toUpperCase().replace(/[\s-]/g, ""), website = str(f, "website").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const hood = str(f, "hood"), about = str(f, "about"), teamSize = str(f, "teamSize"), founded = str(f, "founded");
  const kind = kindOf(f), founderIeEmail = str(f, "founderIeEmail").toLowerCase();
  if (kind === "student_startup") {
    // Not registered yet: no CIF needed (one may be added if it exists), but the founder's IE email. The profile
    // editor doesn't show the email (Folio checked it), so it's only asked for on the details step.
    const askEmail = str(f, "then") !== "profile";
    if (!name || !website || !about || (askEmail && !founderIeEmail)) return { error: "Fill in the startup's name, your IE email, a website or LinkedIn page, and what it does." };
    if (askEmail && !isIeEmail(founderIeEmail)) return { error: "Use your IE University email, like you@student.ie.edu." };
    if (cif && !/^[A-Z0-9]{8,10}$/.test(cif)) return { error: "A CIF / NIF is 9 letters and numbers, like B12345678. Leave it empty if you don't have one yet." };
  } else {
    if (!name || !cif || !website || !about) return { error: "Fill in the legal name, CIF / NIF, website and what the company does." };
    if (!/^[A-Z0-9]{8,10}$/.test(cif)) return { error: "A CIF / NIF is 9 letters and numbers, like B12345678." };
  }
  if (founded && !(/^\d{4}$/.test(founded) && Number(founded) <= new Date().getFullYear())) return { error: "Enter the year the company was founded, like 2024." };
  // The LinkedIn field only exists on the profile editor; leave it untouched when it isn't sent.
  let linkedinUrl: string | undefined;
  if (f.has("linkedinUrl")) {
    const raw = str(f, "linkedinUrl");
    if (raw && !/^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(company|school)\/[^\s]+$/i.test(raw)) return { error: "Use your company's LinkedIn page, like linkedin.com/company/nubolabs." };
    linkedinUrl = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : "";
    // Unchanged (e.g. before migration 0016 adds the column): don't write it, so other edits still save.
    if (linkedinUrl === ((await getOrganization(user))?.linkedinUrl ?? "")) linkedinUrl = undefined;
  }
  const res = await saveOrganization(user, { name, cif, website, hood, about, founded, teamSize, linkedinUrl, kind, founderIeEmail });
  if (res.error) return res;
  refresh();
  if (!submitting) return { ok: true }; // saved from the profile page: stay there and show a toast
  if (founderLinkedin && !user.linkedinVerified) {
    const saved = await saveFounderLinkedin(user, /^https?:\/\//i.test(founderLinkedin) ? founderLinkedin : `https://${founderLinkedin}`);
    if (saved.error) return saved;
  }
  const sent = await submitVerification();
  if (sent.error) return sent;
  refresh();
  redirect("/company/verify");
}

/** "Finish later" on the details step: saves whatever is filled in (no format checks, that happens on Continue) and
 *  goes back to the dashboard. The legal name is the one field a saved draft needs. */
export async function saveCompanyDetailsDraftAction(f: FormData): Promise<FormState> {
  const user = await requireUser("/company/verify", "company");
  const org = await getOrganization(user);
  if (org?.status === "pending" || org?.status === "verified") redirect("/company"); // locked: nothing to save
  const name = str(f, "name"), cif = str(f, "cif").toUpperCase().replace(/[\s-]/g, ""), website = str(f, "website").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const hood = str(f, "hood"), about = str(f, "about"), founded = str(f, "founded"), teamSize = str(f, "teamSize");
  const kind = kindOf(f), founderIeEmail = str(f, "founderIeEmail").toLowerCase();
  if (!name) return { error: kind === "student_startup" ? "Add the startup's name to save your progress." : "Add the legal company name to save your progress." };
  const res = await saveOrganization(user, {
    name, cif, website, hood, about, founded: /^\d{4}$/.test(founded) ? founded : "", teamSize,
    kind, founderIeEmail: isIeEmail(founderIeEmail) ? founderIeEmail : undefined, // a half-typed email isn't saved
  });
  if (res.error) return res;
  refresh();
  redirect("/company");
}

/** A student startup got registered: the legal name and CIF turn it into a company (the €500 cap lifts). */
export async function registerStartupAction(_: FormState, f: FormData): Promise<FormState> {
  await requireUser("/company/profile", "company");
  const res = await registerStartup(str(f, "legalName"), str(f, "cif"));
  if (res.error) return res;
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- company profile: logo + shared files

export async function uploadLogoAction(f: FormData): Promise<FormState> {
  const user = await requireUser("/company/profile", "company");
  const file = f.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { error: "Use a JPG, PNG or WebP image." };
  if (file.size > 2 * 1024 * 1024) return { error: "The logo must be under 2 MB." };
  const res = await saveOrgLogo(user, file);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function removeLogoAction(): Promise<FormState> {
  const user = await requireUser("/company/profile", "company");
  const res = await removeOrgLogo(user);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function setLogoColorAction(color: string): Promise<FormState> {
  const user = await requireUser("/company/profile", "company");
  if (!isAvatarColor(color)) return { error: "Pick one of the colours." };
  const res = await setOrgLogoColor(user, color);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

const FILE_TYPES = new Set([".pdf", ".pptx", ".docx", ".jpg", ".jpeg", ".png", ".webp"]);

export async function uploadCompanyFileAction(f: FormData): Promise<FormState> {
  const user = await requireUser("/company/profile", "company");
  const file = f.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  const ext = path.extname(file.name).toLowerCase();
  if (!FILE_TYPES.has(ext)) return { error: "Upload a PDF, PowerPoint, Word document or image." };
  if (file.size > 10 * 1024 * 1024) return { error: "The file must be under 10 MB." };
  const res = await saveCompanyFile(user, file, ext);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function deleteCompanyFileAction(id: string): Promise<FormState> {
  const user = await requireUser("/company/profile", "company");
  const res = await deleteCompanyFile(user, id);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

const DOC_TYPES = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

export async function uploadCompanyDocAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/company/verify", "company");
  const kind = str(f, "kind") as DocKind, file = f.get("file");
  if (!DOC_KINDS.includes(kind)) return { error: "Unknown document." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  const ext = path.extname(file.name).toLowerCase();
  if (!DOC_TYPES.has(ext)) return { error: "Upload a PDF, JPG or PNG." };
  if (file.size > 10 * 1024 * 1024) return { error: "The file must be under 10 MB." };
  const res = await saveCompanyDoc(user, kind, file, ext);
  if (res.error) return res;
  revalidatePath("/company", "layout"); // the payment page asks for them now
  return { ok: true };
}

export async function removeCompanyDocAction(kind: DocKind): Promise<FormState> {
  const user = await requireUser("/company/verify", "company");
  if (!DOC_KINDS.includes(kind)) return { error: "Unknown document." };
  const res = await removeCompanyDoc(user, kind);
  if (res.error) return res;
  revalidatePath("/company", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------- projects

export async function postCompanyProjectAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/company/projects/new", "company");
  const org = await getOrganization(user);
  if (org?.status !== "verified") return { error: "Your company needs to be verified before you can post." };
  const title = str(f, "title"), summary = str(f, "summary"), deliverable = str(f, "deliverable");
  const category = str(f, "category") as Category;
  const priceEur = Number(f.get("priceEur")), weeks = Number(f.get("weeks"));
  const skills = f.getAll("skills").map(String).map((s) => s.trim()).filter(Boolean).slice(0, 8);
  if (!title || !summary) return { error: "Add a title and description." };
  if (!CATEGORIES.includes(category)) return { error: "Pick a category." };
  if (!deliverable || skills.length === 0) return { error: "Describe the deliverable and pick at least one skill." };
  if (!(priceEur >= 150)) return { error: "Set a price of at least €150." };
  if (isStartup(org) && priceEur > STARTUP_MAX_PAY) return { error: `Student startups can post projects of up to €${STARTUP_MAX_PAY} until the startup is registered.` };
  if (!(weeks >= 1 && weeks <= 6)) return { error: "Duration must be 1 to 6 weeks." };
  if (paymentsMode() === "off") return { error: "Payments aren't available yet, so projects can't be published right now." };
  const res = await createCompanyProject(user, org, { title, summary, deliverable, category, priceEur: Math.round(priceEur), weeks, skills });
  if (res.error || !res.id) return { error: res.error ?? "Couldn't post your project." };
  const draftId = str(f, "draftId");
  if (draftId) await deleteProjectDraft(user, draftId); // it became a real project
  refresh();
  if (!res.unpaid) redirect(`/company/projects/${res.id}?posted=1`);                // before the payments migration
  const escrow = await createEscrow(user, res.id, Math.round(priceEur));
  if (escrow.error) return { error: escrow.error };
  redirect(`/company/projects/${res.id}/pay`);                                        // the project opens once it's paid
}

// ---------------------------------------------------------------- applicants

export async function acceptApplicantAction(applicationId: string): Promise<FormState> {
  await requireUser("/company/applicants", "company");
  const res = await acceptApplicant(applicationId);
  if (res.error) return { error: res.error };
  refresh();
  const n = res.declined ?? 0;
  return { ok: true, notice: n ? `${n} other applicant${n > 1 ? "s" : ""} declined. Project is now in progress.` : "Project is now in progress." };
}

// The date and time arrive as an ISO string built in the company's browser (so it's their local time).
export async function inviteToInterviewAction(_: FormState, f: FormData): Promise<FormState> {
  await requireUser("/company/applicants", "company");
  const at = str(f, "at"), place = str(f, "place"), note = str(f, "note").slice(0, 600);
  if (!at || Number.isNaN(Date.parse(at))) return { error: "Pick a date and a time." };
  if (Date.parse(at) < Date.now()) return { error: "Pick a date and time in the future." };
  if (place.length < 3) return { error: "Add a meeting link or an address." };
  const res = await inviteToInterview(str(f, "applicationId"), new Date(at).toISOString(), place.slice(0, 300), note);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function declineApplicantAction(applicationId: string): Promise<FormState> {
  await requireUser("/company/applicants", "company");
  const res = await declineApplicant(applicationId);
  if (res.error) return res;
  refresh();
  return { ok: true };
}

export async function verifyDeliveryAction(_: FormState, f: FormData): Promise<FormState> {
  await requireUser("/company/applicants", "company");
  const rating = Number(f.get("rating")), review = str(f, "review");
  if (!(rating >= 1 && rating <= 5)) return { error: "Pick a rating from 1 to 5 stars." };
  if (review.length < 10) return { error: "Write a short review (at least 10 characters)." };
  const signature = str(f, "signature");
  if (signature && !(signature.startsWith("data:image/png;base64,") && signature.length < 200_000)) return { error: "Draw or type your signature again." };
  const res = await verifyDelivery(str(f, "applicationId"), rating, review.slice(0, 600), signature || undefined);
  if (res.error) return res;
  refresh();
  revalidatePath("/profile");
  return { ok: true };
}

// ---------------------------------------------------------------- unfinished drafts

/** Saves the "post a project" form as it is (any field may be empty) and returns the draft's id. */
export async function saveProjectDraftAction(id: string | null, data: unknown, step: number): Promise<{ id?: string; error?: string }> {
  const user = await requireUser("/company/projects/new", "company");
  const res = await saveProjectDraft(user, id, data, step);
  if (!res.error) revalidatePath("/company/projects");
  return res;
}

export async function deleteProjectDraftAction(id: string): Promise<FormState> {
  const user = await requireUser("/company/projects", "company");
  await deleteProjectDraft(user, id);
  revalidatePath("/company/projects");
  return { ok: true };
}
