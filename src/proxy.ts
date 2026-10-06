// Keeps the Supabase session fresh on every request (Next 16 "proxy", formerly middleware).
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // A confirmation or sign-in link can land on the wrong page: Supabase falls back to the Site URL (the
  // homepage) when the return address isn't on its Redirect URLs list. Finish the sign-in at /auth/callback
  // anyway, so the person continues their sign-up instead of arriving signed out on the homepage.
  const { pathname, searchParams } = request.nextUrl;
  if (!pathname.startsWith("/auth/") && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const to = request.nextUrl.clone();
    to.pathname = searchParams.has("token_hash") ? "/auth/confirm" : "/auth/callback";
    if (pathname !== "/" && !searchParams.has("next")) to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"] };
