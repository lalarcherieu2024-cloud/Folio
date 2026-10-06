import { NextResponse } from "next/server";
import { safeNext } from "@/lib/form";
import { TERMS_VERSION } from "@/lib/legal";
import { homeFor } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

// Landing point for (a) the confirmation link in Supabase's sign-up email,
// (b) the return trip after linking a GitHub / LinkedIn account, and
// (c) signing in or up with LinkedIn (via=linkedin, students only: LinkedInButton).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next") ?? "");
  const viaLinkedIn = searchParams.get("via") === "linkedin";
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Copy the freshly linked identities onto the profile (safe to run after any sign-in).
      await supabase.rpc("sync_verified_identities");
      if (viaLinkedIn) return NextResponse.redirect(`${origin}${next || (await afterLinkedIn(supabase, data.user))}`);
      // Companies continue their verification; students continue their onboarding.
      const home = data.user?.user_metadata?.role === "company" ? "/company/verify" : "/welcome";
      return NextResponse.redirect(`${origin}${next || home}`);
    }
  }
  // LinkedIn sign-in (including the visitor pressing Cancel on LinkedIn) goes back to sign-in with a message.
  if (viaLinkedIn) return NextResponse.redirect(`${origin}/signin?error=linkedin${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  const failed = next || "/signin";
  return NextResponse.redirect(`${origin}${failed}${failed.includes("?") ? "&" : "?"}error=link`);
}

type Supabase = Awaited<ReturnType<typeof createClient>>;
type User = Awaited<ReturnType<Supabase["auth"]["exchangeCodeForSession"]>>["data"]["user"];

// Where a LinkedIn sign-in lands. A brand-new account was made a student by the sign-up trigger (no role in its
// metadata) and named after its email, so it takes the name from LinkedIn and starts onboarding. An existing
// account (also one made with a password and the same email, which Supabase links) just goes home.
async function afterLinkedIn(supabase: Supabase, user: User) {
  if (!user) return "/signin";
  const { data: profile } = await supabase.from("profiles").select("role, full_name, avatar_path").eq("id", user.id).maybeSingle();
  if (!profile) return "/signin";
  if (profile.role === "company") return homeFor("company");
  const meta = user.user_metadata ?? {};
  // The LinkedIn button carries a notice that continuing accepts the Terms; record it like the sign-up checkbox does.
  if (!meta.terms_version) await supabase.auth.updateUser({ data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString(), terms_via: "linkedin" } });
  const name = [meta.full_name, meta.name, [meta.given_name, meta.family_name].filter(Boolean).join(" ")].find((n) => typeof n === "string" && n.trim());
  if (name && profile.full_name === user.email?.split("@")[0]) await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", user.id);
  // Onboarding starts with the profile photo, so no photo yet means it isn't done.
  return profile.avatar_path ? homeFor("student") : "/welcome";
}
