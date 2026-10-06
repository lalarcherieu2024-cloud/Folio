import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

// Landing point for the confirmation email when its template links here with a token hash:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
// Unlike /auth/callback (PKCE code), this works in any browser or device, not only the one that signed up.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const next = safeNext(searchParams.get("next") ?? "");
  if (tokenHash) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      // Companies continue their verification; students continue their onboarding.
      const home = data.user?.user_metadata?.role === "company" ? "/company/verify" : "/welcome";
      return NextResponse.redirect(`${origin}${next || home}`);
    }
  }
  return NextResponse.redirect(`${origin}/signin?error=link`);
}
