import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DEMO_SHARED_SOCIAL_ACCOUNTS } from "@/lib/config";
import { safeNext } from "@/lib/form";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VERIFIED_COLUMN = { linkedin_oidc: "linkedin_verified", github: "github_verified" } as const;

// Landing point for (a) the confirmation link in Supabase's sign-up email and
// (b) the return trip after linking a GitHub / LinkedIn account.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next") ?? "");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Copy the freshly linked identities onto the profile (safe to run after any sign-in).
      await supabase.rpc("sync_verified_identities");
      // Companies continue their verification; students continue their onboarding.
      const home = data.user?.user_metadata?.role === "company" ? "/company/verify" : "/welcome";
      return NextResponse.redirect(`${origin}${next || home}`);
    }
  }
  // Pass on why it failed (Supabase / the provider send it as error_description), so the page can say so.
  const reason = (searchParams.get("error_description") ?? "").slice(0, 200);
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
