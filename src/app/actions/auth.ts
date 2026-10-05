"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SKIP_EMAIL_CONFIRMATION } from "@/lib/config";
import { EMAIL, safeNext, str, type FormState } from "@/lib/form";
import { homeFor } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export async function signUpAction(_: FormState, f: FormData): Promise<FormState> {
  const fullName = str(f, "fullName"), email = str(f, "email").toLowerCase(), program = str(f, "program");
  if (!fullName) return { error: "Enter your name." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email." };
  if (str(f, "password").length < 8) return { error: "Use a password of at least 8 characters." };
  const role: Role = str(f, "role") === "company" ? "company" : "student";
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const landing = role === "company" ? "/company/verify" : "/welcome";
  const password = str(f, "password");

  if (SKIP_EMAIL_CONFIRMATION) {
    // No email step: create the account already confirmed, then sign straight in.
    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName, program, role },
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
    redirect(landing);
  }

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, program, role }, emailRedirectTo: `${origin}/auth/callback` },
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
  redirect(landing);
}

// Student sign-up step 2: the 6-digit code from the confirmation email (companies use verifyCompanyEmailAction).
export async function verifyStudentEmailAction(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase(), token = str(f, "code").replace(/\D/g, "");
  if (!EMAIL.test(email)) return { error: "Start again from Create account." };
  if (token.length !== 6) return { error: "Enter all 6 digits." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: error.code === "otp_expired" ? "That code has expired. Send a new one." : "That code isn't right. Check the email and try again." };
  redirect("/welcome");
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
  redirect(safeNext(str(f, "next")) || homeFor(actual));
}

export async function signOutAction() {
  await (await createClient()).auth.signOut();
  redirect("/");
}
