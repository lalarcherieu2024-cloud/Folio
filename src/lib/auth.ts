import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { StudentProfile } from "./types";

// Current signed-in student (or null). Cached per request so the layout and the page share one lookup.
export const getSession = cache(async (): Promise<StudentProfile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // verifies the token with Supabase
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!p) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: p.full_name,
    program: p.program,
    uniEmailVerified: p.uni_email_verified,
    githubHandle: p.github_handle,
    linkedinUrl: p.linkedin_url,
    cv: p.cv_name ? { fileName: p.cv_name, sizeKb: p.cv_size_kb ?? 0, uploadedAt: p.cv_uploaded_at } : null,
    strengths: p.strengths ?? null,
  };
});

export async function requireUser(next = "/"): Promise<StudentProfile> {
  const user = await getSession();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}
