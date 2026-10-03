"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { StudentProfile } from "@/lib/types";

const PROVIDERS = [
  { id: "github", label: "GitHub", note: "Optional, handy if you do tech work. Proves the handle is yours." },
  { id: "linkedin_oidc", label: "LinkedIn", note: "Proves the account belongs to you." },
] as const;

export function ConnectAccounts({ user }: { user: StudentProfile }) {
  const [busy, setBusy] = useState<string | null>(null);
  const verified = { github: user.githubVerified, linkedin_oidc: user.linkedinVerified };

  async function connect(provider: "github" | "linkedin_oidc") {
    setBusy(provider);
    const { error } = await createClient().auth.linkIdentity({ provider, options: { redirectTo: `${location.origin}/auth/callback?next=/profile` } });
    if (error) {
      setBusy(null);
      toast.error(/manual linking/i.test(error.message) ? "Linking is switched off in Supabase (Authentication settings → Allow manual linking)." : error.message);
    } // on success the browser is already redirecting to GitHub / LinkedIn
  }

  return (
    <div className="grid gap-2.5 rounded-lg border bg-panel p-3.5">
      <span className="text-sm font-medium">Verify your accounts</span>
      {PROVIDERS.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col leading-tight"><span className="text-sm">{p.label}</span><span className="text-xs text-muted-foreground">{p.note}</span></div>
          {verified[p.id]
            ? <span className="inline-flex h-[1.375rem] shrink-0 items-center gap-1 rounded-md bg-[#dcfce7] px-2 text-xs font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />Verified</span>
            : <Button type="button" variant="outline" size="sm" disabled={busy === p.id} onClick={() => connect(p.id)} className="h-8 shrink-0 bg-white px-3 text-[0.8125rem]">{busy === p.id ? "Opening…" : `Connect ${p.label}`}</Button>}
        </div>
      ))}
    </div>
  );
}
