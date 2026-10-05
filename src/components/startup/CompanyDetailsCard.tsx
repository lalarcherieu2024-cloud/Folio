"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { saveCompanyDetailsAction } from "@/app/actions/startup";
import { ConnectAccounts } from "@/components/student/ConnectAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organization } from "@/lib/data/startup";
import type { FormState } from "@/lib/form";
import type { StudentProfile } from "@/lib/types";

/** Company details and links, edited in place on the profile page. Legal name and CIF lock once submitted for review. */
export function CompanyDetailsCard({ user, org }: { user: StudentProfile; org: Organization }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCompanyDetailsAction, {});
  const locked = org.status === "pending" || org.status === "verified";
  // Controlled fields: after a save the server sends new values, and uncontrolled inputs warn when their default changes.
  const [v, setV] = useState({ name: org.name, cif: org.cif, website: org.website, hood: org.hood, about: org.about, founded: org.founded, teamSize: org.teamSize, linkedinUrl: org.linkedinUrl });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("Profile saved");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <input type="hidden" name="then" value="profile" />
      <div className="flex flex-col gap-1"><span className="text-base font-semibold">Details and links</span><span className="text-[0.8125rem] text-muted-foreground">Connect your LinkedIn so students see a real person behind the company. Add your website and company page.</span></div>
      <ConnectAccounts user={user} providers={["linkedin_oidc"]} next="/company/profile" title="Verify your accounts"
        notes={{ linkedin_oidc: "Proves the account is yours. Students see a “LinkedIn verified” badge." }} />
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Legal company name</Label>
          <Input id="name" name="name" value={v.name} onChange={set("name")} readOnly={locked} className="h-9" />
          {locked && <span className="text-xs text-muted-foreground">Checked by Folio, so it can&apos;t be changed here.</span>}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
          <div className="grid gap-1.5"><Label htmlFor="cif">CIF / NIF</Label><Input id="cif" name="cif" value={v.cif} onChange={set("cif")} readOnly={locked} className="h-9" /></div>
          <div className="grid gap-1.5"><Label htmlFor="website">Website</Label><Input id="website" name="website" value={v.website} onChange={set("website")} placeholder="nubolabs.es" className="h-9" /></div>
        </div>
        <div className="grid gap-1.5"><Label htmlFor="linkedinUrl">Company LinkedIn page</Label><Input id="linkedinUrl" name="linkedinUrl" value={v.linkedinUrl} onChange={set("linkedinUrl")} placeholder="linkedin.com/company/nubolabs" inputMode="url" className="h-9" /></div>
        <div className="grid gap-1.5"><Label htmlFor="hood">Neighbourhood, city</Label><Input id="hood" name="hood" value={v.hood} onChange={set("hood")} placeholder="Malasaña, Madrid" className="h-9" /></div>
        <div className="grid gap-1.5"><Label htmlFor="about">What does the company do?</Label><Textarea id="about" name="about" value={v.about} onChange={set("about")} rows={3} className="resize-y bg-white leading-relaxed" /></div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
          <div className="grid gap-1.5"><Label htmlFor="founded">Founded</Label><Input id="founded" name="founded" value={v.founded} onChange={set("founded")} inputMode="numeric" placeholder="2024" className="h-9" /></div>
          <div className="grid gap-1.5"><Label htmlFor="teamSize">Team size</Label><Input id="teamSize" name="teamSize" value={v.teamSize} onChange={set("teamSize")} placeholder="11–50 employees" className="h-9" /></div>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="h-9 self-start px-3.5">{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
