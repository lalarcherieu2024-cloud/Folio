import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { avatarPublicUrl } from "./avatar";
import { SKIP_EMAIL_CONFIRMATION } from "./config";
import { homeFor } from "./routes";
import type { Role, StudentProfile } from "./types";

// Current signed-in student (or null). Cached per request so the layout and the page share one lookup.
export const getSession = cache(async (): Promise<StudentProfile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // verifies the token with Supabase
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!p) return null;
  const [{ count: fileCount }, { count: certificateCount }] = await Promise.all([
    supabase.from("profile_files").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("course_certificates").select("id", { count: "exact", head: true }).eq("user_id", user.id), // null before migration 0025
  ]);
  return {
    id: user.id,
    role: (p.role as Role) ?? "student",
    email: user.email ?? "",
    fullName: p.full_name,
    program: p.program,
    uniEmailVerified: p.uni_email_verified,
    githubHandle: p.github_handle,
    linkedinUrl: p.linkedin_url,
    githubVerified: !!p.github_verified,
    linkedinVerified: !!p.linkedin_verified,
    cv: p.cv_name ? { fileName: p.cv_name, sizeKb: p.cv_size_kb ?? 0, uploadedAt: p.cv_uploaded_at } : null,
    strengths: p.strengths ?? null,
    avatarColor: p.avatar_color ?? null,
    avatarUrl: avatarPublicUrl(p.avatar_path),
    payoutLink: p.payout_link ?? null,
    paypalEmail: p.paypal_email ?? null,
    fileCount: fileCount ?? 0,
    certificateCount: certificateCount ?? 0,
  };
});

/** A student without a confirmed IE email. Signing up with LinkedIn or a personal email is allowed, but Folio is for
 *  IE students, so onboarding starts by confirming an IE address (migration 0028). Not checked while email checks are
 *  skipped, since no email is ever proven then. */
export const needsIeEmail = (user: StudentProfile) => user.role === "student" && !user.uniEmailVerified && !SKIP_EMAIL_CONFIRMATION;

/** A student who hasn't finished the required onboarding (IE email, profile photo): not "in the app" yet. */
export const isOnboarding = (user: StudentProfile) => user.role === "student" && (needsIeEmail(user) || !user.avatarUrl);

// Signed-in user, or a redirect to sign-in. Pass a role to also keep the other kind of
// account out: a student opening a /company page lands on their own home, and vice versa.
export async function requireUser(next = "/", role?: Role): Promise<StudentProfile> {
  const user = await getSession();
  if (!user) redirect(`${role === "company" ? "/company/signin" : "/signin"}?next=${encodeURIComponent(next)}`);
  if (role && user.role !== role) redirect(homeFor(user.role));
  // Sign-up can't be skipped: a student without the required profile photo is sent back to onboarding.
  // Only for page loads, so the onboarding steps' own uploads (server actions) still work.
  if (isOnboarding(user) && !next.startsWith("/welcome") && !(await headers()).get("next-action")) redirect("/welcome");
  return user;
}
