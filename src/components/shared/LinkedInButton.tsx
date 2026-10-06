"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// LinkedIn's "in" mark, as its sign-in button guidelines ask for.
const LinkedInLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

// Signs a student in, or up, with LinkedIn. The trip ends on /auth/callback (via=linkedin), which picks
// where they land: /welcome for a new account, their home otherwise.
export function LinkedInButton({ label = "Continue with LinkedIn", next }: { label?: string; next?: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const params = new URLSearchParams({ via: "linkedin" });
    if (next) params.set("next", next);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo: `${location.origin}/auth/callback?${params}` },
    });
    // On success the browser is already on its way to LinkedIn.
    if (error) {
      setBusy(false);
      toast.error("Couldn't reach LinkedIn. Try again, or use your email.");
    }
  }
  return (
    <button type="button" onClick={go} disabled={busy}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0a66c2] px-4 text-sm font-medium text-white transition-colors hover:bg-[#004182] disabled:opacity-60">
      <LinkedInLogo />{busy ? "Opening LinkedIn…" : label}
    </button>
  );
}

export const OrDivider = ({ children = "or" }: { children?: React.ReactNode }) => (
  <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{children}<span className="h-px flex-1 bg-border" /></div>
);
