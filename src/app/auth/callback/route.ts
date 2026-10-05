import { NextResponse } from "next/server";
import { safeNext } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

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
  const failed = next || "/signin";
  return NextResponse.redirect(`${origin}${failed}${failed.includes("?") ? "&" : "?"}error=link`);
}
