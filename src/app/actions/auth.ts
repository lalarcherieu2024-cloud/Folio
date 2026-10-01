"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EMAIL, safeNext, str, type FormState } from "@/lib/form";
import { homeFor } from "@/lib/routes";
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
  const { data, error } = await supabase.auth.signUp({
    email, password: str(f, "password"),
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
  redirect(role === "company" ? "/company?welcome=1" : "/profile?welcome=1");
}

export async function signInAction(_: FormState, f: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: str(f, "email").toLowerCase(), password: str(f, "password") });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Confirm your email first: check your inbox for the link." };
    return { error: "Wrong email or password." };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  redirect(safeNext(str(f, "next")) || homeFor((profile?.role as Role) ?? "student"));
}

export async function signOutAction() {
  await (await createClient()).auth.signOut();
  redirect("/");
}
