"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, needsIeEmail } from "@/lib/auth";
import { SKIP_EMAIL_CONFIRMATION } from "@/lib/config";
import { canDeleteAccounts, getUnfinishedSignup } from "@/lib/data/signup";
import { EMAIL, str, type FormState } from "@/lib/form";
import { isIeEmail } from "@/lib/ie-email";
import { TERMS_VERSION } from "@/lib/legal";
import { homeFor } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

// The root layout picks the frame (signed-in app or public site) from the session, and the client router keeps
// layouts between pages. Anything that signs someone in or out clears them, or the next page shows in the old frame
// (e.g. a student's home under the signed-out "Sign in / Create account" header).
const refreshFrame = () => revalidatePath("/", "layout");

export async function signUpAction(_: FormState, f: FormData): Promise<FormState> {
  const fullName = str(f, "fullName"), email = str(f, "email").toLowerCase(), program = str(f, "program");
  if (!fullName) return { error: "Enter your name." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email." };
  if (str(f, "password").length < 8) return { error: "Use a password of at least 8 characters." };
  if (f.get("terms") !== "on") return { error: "Please agree to the Terms of Service to create an account." };
  // Kept on the account as the record of what was agreed and when.
  const consent = { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() };
  const role: Role = str(f, "role") === "company" ? "company" : "student";
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const landing = role === "company" ? "/company/verify" : "/welcome";
  const password = str(f, "password");

  if (SKIP_EMAIL_CONFIRMATION) {
    // No email step: create the account already confirmed, then sign straight in.
    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName, program, role, ...consent },
    });
    if (createError) {
      if (createError.code === "email_exists" || /already (been )?registered/i.test(createError.message)) return { error: "An account with this email already exists. Sign in instead." };
      if (createError.code === "weak_password") return { error: "That password is too weak. Try a longer one." };
      console.error("createUser", createError);
      return { error: "Couldn't create your account. Try again in a moment." };
    }
    await admin.from("profiles").update({ uni_email_verified: false }).eq("id", created.user.id);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { ok: true, notice: "Account created. Sign in to continue." };
    refreshFrame();
    redirect(landing);
  }

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, program, role, ...consent }, emailRedirectTo: `${origin}/auth/callback` },
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
  refreshFrame();
  redirect(landing);
}

export async function signInAction(_: FormState, f: FormData): Promise<FormState> {
  const supabase = await createClient();
  const email = str(f, "email").toLowerCase(), password = str(f, "password");
  let res = await supabase.auth.signInWithPassword({ email, password });
  if (res.error?.code === "email_not_confirmed" && SKIP_EMAIL_CONFIRMATION) {
    // Account made before the switch was on: confirm it now and retry.
    const admin = createAdminClient();
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const stuck = list?.users.find((u) => u.email?.toLowerCase() === email);
    if (stuck) {
      await admin.auth.admin.updateUserById(stuck.id, { email_confirm: true });
      await admin.from("profiles").update({ uni_email_verified: false }).eq("id", stuck.id);
      res = await supabase.auth.signInWithPassword({ email, password });
    }
  }
  if (res.error) {
    if (res.error.code === "email_not_confirmed") return { error: "Confirm your email first: check your inbox for the link." };
    return { error: "Wrong email or password." };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", res.data.user.id).maybeSingle();
  const actual: Role = profile?.role === "company" ? "company" : "student";
  const expected: Role = str(f, "role") === "company" ? "company" : "student";
  if (actual !== expected) {
    // Each sign-in page is for one kind of account; don't leave a session open on the wrong side.
    await supabase.auth.signOut();
    return { error: actual === "company"
      ? "This is a company account. Choose Company above and sign in again."
      : "This is a student account. Choose Student above and sign in again." };
  }
  refreshFrame();
  // Every sign-in starts on your own home page (students: /home, companies: /company), wherever you came from.
  redirect(homeFor(actual));
}

/** Onboarding's first step for a student without a confirmed IE email (needsIeEmail): changes the account's email
 *  to their IE address, which Supabase only does once the link it emails there is clicked. The link comes back
 *  through /auth/callback to /welcome, and migration 0028 then marks the IE email as verified. */
export async function confirmIeEmailAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await getSession();
  if (!user || !needsIeEmail(user)) return { error: "Your IE email is already confirmed. Reload the page." };
  const email = str(f, "email").toLowerCase();
  if (!EMAIL.test(email) || !isIeEmail(email)) return { error: "Use your IE email, ending in @student.ie.edu or @ie.edu." };
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = email === user.email
    // Already the account's email (signed up with it, but never confirmed): send the confirmation again.
    ? await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback?next=/welcome` } })
    : await supabase.auth.updateUser({ email }, { emailRedirectTo: `${origin}/auth/callback?next=/welcome` });
  if (error) {
    if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) return { error: "Another Folio account already uses this email. Sign out and sign in with that one instead." };
    if (error.code === "over_email_send_rate_limit") return { error: "Too many emails right now. Wait a minute and try again." };
    console.error("confirmIeEmail", error);
    return { error: "Couldn't send the email. Try again in a moment." };
  }
  return { ok: true, notice: email };
}

export async function signOutAction() {
  await (await createClient()).auth.signOut();
  refreshFrame();
  redirect("/");
}

// Every place an account's own files can be (paths start with "<user id>/"). Chat, project and submission files
// only exist for accounts with activity, which are never deleted here.
const OWN_FILE_BUCKETS = ["avatars", "cvs", "company-docs", "company-files"];

/** "Start from scratch": deletes an unfinished sign-up (getUnfinishedSignup) and opens a fresh sign-up as `to`. */
export async function startOverAction(to: Role): Promise<{ error?: string }> {
  const user = await getSession();
  const unfinished = await getUnfinishedSignup(user);
  if (!user || !unfinished) return { error: "There's no unfinished sign-up to start over." };
  if (!canDeleteAccounts()) return { error: "Starting over isn't available right now. Sign out to sign up with another email." };
  if (!unfinished.canStartOver) return { error: "This account already has activity, so it can't be deleted here. Sign out to sign up with another email." };

  const admin = createAdminClient();
  // A company's draft organisation doesn't delete with its owner (no cascade); its documents and files rows do.
  if (user.role === "company") {
    const { error } = await admin.from("organizations").delete().eq("owner_id", user.id);
    if (error) { console.error("startOver organizations", error); return { error: "Couldn't remove your draft company. Try again." }; }
  }
  await Promise.all(OWN_FILE_BUCKETS.map(async (bucket) => {
    const { data } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
    if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${user.id}/${f.name}`));
  }));
  // The profile and everything that cascades from it go with the account.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) { console.error("startOver deleteUser", error); return { error: "Couldn't delete the unfinished account. Try again." }; }

  // The account is gone, so only clear this browser's session cookies.
  await (await createClient()).auth.signOut({ scope: "local" });
  refreshFrame();
  redirect(to === "company" ? "/company/signup" : "/signup");
}
