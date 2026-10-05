import { Check, Download, ExternalLink } from "lucide-react";
import { SignCertificateDialog } from "@/components/shared/SignCertificateDialog";
import type { SignatureState } from "@/lib/data/signatures";
import type { Credential } from "@/lib/types";

// "October 2026" -> { year: 2026, month: 10 } for LinkedIn's form.
function issued(issuedAt: string) {
  const d = new Date(`1 ${issuedAt}`);
  return Number.isNaN(d.getTime()) ? null : { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const btn = "inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-3 text-[0.8125rem] font-medium hover:bg-muted";

/** Under a verified credential: the PDF certificate, and a shortcut to add it to LinkedIn's "Licenses & certifications". */
export function CredentialActions({ c, origin, sig }: { c: Credential; origin: string; sig?: SignatureState }) {
  const client = c.orgName ?? c.clientName;
  const when = issued(c.issuedAt);
  const params = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: c.projectTitle, organizationName: "Folio", certUrl: `${origin}/verify/${c.id}`, certId: c.id });
  if (when) { params.set("issueYear", String(when.year)); params.set("issueMonth", String(when.month)); }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sig?.clientSignedAt && !sig.studentSignedAt && <SignCertificateDialog credentialId={c.id} as="student" project={c.projectTitle} otherParty={client} />}
      <a href={`/api/credentials/${c.id}/certificate`} className={btn}><Download className="size-3.5" />Download certificate</a>
      <a href={`https://www.linkedin.com/profile/add?${params}`} target="_blank" rel="noopener noreferrer" className={btn}><ExternalLink className="size-3.5" />Add to LinkedIn</a>
      {sig && (
        <span className="basis-full text-xs text-muted-foreground">
          {sig.studentSignedAt ? <span className="inline-flex items-center gap-1 font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />Signed by {client} and by you</span>
            : sig.clientSignedAt ? `${client} signed. Add your signature to complete it.`
            : `Waiting for ${client} to sign.`}
        </span>
      )}
    </div>
  );
}
