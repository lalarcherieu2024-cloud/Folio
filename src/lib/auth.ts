import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { avatarPublicUrl } from "./avatar";
import { homeFor } from "./routes";
import type { Role, StudentProfile } from "./types";

// Current signed-in student (or null). Cached per request so the layout and the page share one lookup.
export const getSession = cache(async (): Promise<StudentProfile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // verifies the token with Supabase
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!p) return null;
  const { count: fileCount } = await supabase.from("profile_files").select("id", { count: "exact", head: true }).eq("user_id", user.id);
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
    fileCount: fileCount ?? 0,
  };
});

// Signed-in user, or a redirect to sign-in. Pass a role to also keep the other kind of
// account out: a student opening a /company page lands on their own home, and vice versa.
export async function requireUser(next = "/", role?: Role): Promise<StudentProfile> {
  const user = await getSession();
  if (!user) redirect(`${role === "company" ? "/company/signin" : "/signin"}?next=${encodeURIComponent(next)}`);
  if (role && user.role !== role) redirect(homeFor(user.role));
  return user;
}
