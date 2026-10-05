"use client";

import { Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { StudentProfile } from "@/lib/types";

const PROVIDERS = [
  { id: "github", label: "GitHub", note: "Optional, handy if you do tech work. Proves the handle is yours." },
  { id: "linkedin_oidc", label: "LinkedIn", note: "Proves the account belongs to you." },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

// Supabase's messages, in plain words.
function explain(reason: string | null) {
  if (!reason) return "The account couldn't be connected. Try again.";
  if (/already linked|already exists|identity.*(in use|exists)/i.test(reason)) return "That account is already connected to another Folio login. Disconnect it there first, or use a different account.";
  if (/manual linking/i.test(reason)) return "Linking is switched off in Supabase (Authentication settings → Allow manual linking).";
  if (/access_denied|denied|cancel/i.test(reason)) return "The connection was cancelled.";
  return `The account couldn't be connected: ${reason}`;
}

export function ConnectAccounts({ user, providers, next = "/profile", title = "Verify your accounts", notes }: {
  user: StudentProfile; providers?: ProviderId[]; next?: string; title?: string; notes?: Partial<Record<ProviderId, string>>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const verified = { github: user.githubVerified, linkedin_oidc: user.linkedinVerified };
  // After a failed link, /auth/callback sends you back here with ?error=link&reason=…
  const params = useSearchParams();
  const linkError = params.get("error") === "link" ? explain(params.get("reason")) : null;

  async function connect(provider: "github" | "linkedin_oidc") {
    setBusy(provider);
    const { error } = await createClient().auth.linkIdentity({ provider, options: { redirectTo: `${location.origin}/auth/callback?provider=${provider}&next=${encodeURIComponent(next)}` } });
    if (error) {
      setBusy(null);
      toast.error(/manual linking/i.test(error.message) ? "Linking is switched off in Supabase (Authentication settings → Allow manual linking)." : error.message);
    } // on success the browser is already redirecting to GitHub / LinkedIn
  }

  return (
    <div className="grid gap-2.5 rounded-lg border bg-panel p-3.5">
      <span className="text-sm font-medium">{title}</span>
      {linkError && <p role="alert" className="rounded-md bg-[#fee2e2] px-3 py-2 text-[0.8125rem] text-[#991b1b]">{linkError}</p>}
      {PROVIDERS.filter((p) => !providers || providers.includes(p.id)).map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col leading-tight"><span className="text-sm">{p.label}</span><span className="text-xs text-muted-foreground">{notes?.[p.id] ?? p.note}</span></div>
          {verified[p.id]
            ? <span className="inline-flex h-[1.375rem] shrink-0 items-center gap-1 rounded-md bg-[#dcfce7] px-2 text-xs font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />Verified</span>
            : <Button type="button" variant="outline" size="sm" disabled={busy === p.id} onClick={() => connect(p.id)} className="h-8 shrink-0 bg-white px-3 text-[0.8125rem]">{busy === p.id ? "Opening…" : `Connect ${p.label}`}</Button>}
        </div>
      ))}
    </div>
  );
}
