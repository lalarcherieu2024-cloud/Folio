import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the confirmation link in Supabase's sign-up email.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    // Companies continue their verification; students land on their profile.
    if (!error) return NextResponse.redirect(`${origin}${data.user?.user_metadata?.role === "company" ? "/company/verify" : "/profile?welcome=1"}`);
  }
  return NextResponse.redirect(`${origin}/signin?error=confirm`);
}
