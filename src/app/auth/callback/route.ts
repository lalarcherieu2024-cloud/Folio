import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DEMO_SHARED_SOCIAL_ACCOUNTS } from "@/lib/config";
import { safeNext } from "@/lib/form";
import { TERMS_VERSION } from "@/lib/legal";
import { homeFor } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VERIFIED_COLUMN = { linkedin_oidc: "linkedin_verified", github: "github_verified" } as const;

// Landing point for (a) the confirmation link in Supabase's sign-up email,
// (b) the return trip after linking a GitHub / LinkedIn account, and
// (c) signing in or up with LinkedIn (via=linkedin; as=company from the company pages: LinkedInButton).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next") ?? "");
  const viaLinkedIn = searchParams.get("via") === "linkedin";
  const asCompany = searchParams.get("as") === "company";
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Copy the freshly linked identities onto the profile (safe to run after any sign-in).
      await supabase.rpc("sync_verified_identities");
      // Signing in with LinkedIn starts on your home page, like any other sign-in (or onboarding, for a new account).
      if (viaLinkedIn) return NextResponse.redirect(`${origin}${await afterLinkedIn(supabase, data.user, asCompany, next)}`);
      // Companies continue their verification; students continue their onboarding.
      const home = data.user?.user_metadata?.role === "company" ? "/company/verify" : "/welcome";
      return NextResponse.redirect(`${origin}${next || home}`);
    }
  }
  // Pass on why it failed (Supabase / the provider send it as error_description), so the page can say so.
  const reason = (searchParams.get("error_description") ?? "").slice(0, 200);
  // LinkedIn sign-in (including the visitor pressing Cancel on LinkedIn) goes back to sign-in with a message.
  if (viaLinkedIn) return NextResponse.redirect(`${origin}/signin?error=linkedin${asCompany ? "&as=company" : ""}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  const failed = next || "/signin";

  // DEMO ONLY (see lib/config.ts): the account is already linked to another Folio login, so Supabase refused
  // to link it again. Mark this login verified anyway, so one LinkedIn can be shown on several demo accounts.
  const provider = searchParams.get("provider") as keyof typeof VERIFIED_COLUMN | null;
  if (DEMO_SHARED_SOCIAL_ACCOUNTS && provider && provider in VERIFIED_COLUMN && /already linked|already exists|identity.*(in use|exists)/i.test(reason)) {
    const user = await getSession();
    if (user) {
      const { error } = await createAdminClient().from("profiles").update({ [VERIFIED_COLUMN[provider]]: true }).eq("id", user.id);
      if (!error) return NextResponse.redirect(`${origin}${failed}`);
      console.error("demo shared social account", error);
    }
  }

  return NextResponse.redirect(`${origin}${failed}${failed.includes("?") ? "&" : "?"}error=link${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`);
}

type Supabase = Awaited<ReturnType<typeof createClient>>;
type User = Awaited<ReturnType<Supabase["auth"]["exchangeCodeForSession"]>>["data"]["user"];

// Where a LinkedIn sign-in lands. A brand-new account was made a student by the sign-up trigger (no role in its
// metadata) and named after its email, so it takes the name from LinkedIn and starts onboarding. From the company
// pages (asCompany) a brand-new account is switched to a company first (become_company, migration 0027). An existing
// account (also one made with a password and the same email, which Supabase links) just goes home.
async function afterLinkedIn(supabase: Supabase, user: User, asCompany: boolean, next = "") {
  if (!user) return "/signin";
  const { data: profile } = await supabase.from("profiles").select("role, full_name, avatar_path").eq("id", user.id).maybeSingle();
  if (!profile) return "/signin";
  const meta = user.user_metadata ?? {};
  // Only a fresh, untouched account switches; anyone else lands on /company/signup, which offers to continue their
  // own sign-up or start from scratch (or sends a finished account home).
  const newCompany = asCompany && profile.role === "student";
  if (newCompany) {
    const { data: switched } = await supabase.rpc("become_company");
    if (!switched) return "/company/signup";
    await supabase.auth.updateUser({ data: { role: "company" } });
  }
  // The LinkedIn button carries a notice that continuing accepts the Terms; record it like the sign-up checkbox does.
  if (!meta.terms_version) await supabase.auth.updateUser({ data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString(), terms_via: "linkedin" } });
  const name = [meta.full_name, meta.name, [meta.given_name, meta.family_name].filter(Boolean).join(" ")].find((n) => typeof n === "string" && n.trim());
  if (name && profile.full_name === user.email?.split("@")[0]) await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", user.id);
  // A new company starts verification; a student's onboarding starts with the profile photo, so no photo yet means
  // it isn't done.
  if (newCompany) return next.startsWith("/company/verify") ? next : "/company/verify"; // e.g. ?founder=1
  if (profile.role === "company") return homeFor("company");
  return profile.avatar_path ? homeFor("student") : "/welcome";
}
