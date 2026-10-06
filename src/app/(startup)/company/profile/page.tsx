import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CredentialCard } from "@/components/shared/CredentialCard";
import { SignCertificateDialog } from "@/components/shared/SignCertificateDialog";
import { CompanyDetailsCard } from "@/components/startup/CompanyDetailsCard";
import { CompanyFilesCard } from "@/components/startup/CompanyFiles";
import { CompanyLogoEditor } from "@/components/startup/CompanyLogoEditor";
import { CompanyProjectCard } from "@/components/startup/CompanyProjectCard";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { getCompanyProjects, getIssuedCredentials, getOrganization } from "@/lib/data/startup";
import { firstName } from "@/lib/work";

export const metadata = { title: "Company profile · Folio" };

const STATUS = {
  verified: ["Company verified", true],
  pending: ["Verification under review", false],
  rejected: ["Changes needed", false],
  draft: ["Not verified yet", false],
} as const;

function Status({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return on
    ? <Badge className="h-[1.375rem] gap-1 rounded-md bg-[#dcfce7] px-2 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]"><Check className="size-3" strokeWidth={3} />{yes}</Badge>
    : <Badge variant="outline" className="h-[1.375rem] rounded-md px-2 text-xs font-medium text-muted-foreground">{no}</Badge>;
}

// STARTUP INTERFACE (owner: startup builder). The company profile, laid out like the student profile.
export default async function CompanyProfile() {
  const user = await requireUser("/company/profile", "company");
  const org = await getOrganization(user);
  if (!org) redirect("/company/verify");
  const [projects, certificates] = await Promise.all([getCompanyProjects(user), getIssuedCredentials(user)]);
  const issued = certificates.length;
  const unsigned = certificates.filter((c) => !c.signedByCompany).length;
  const open = projects.filter((p) => p.status === "open");
  const [statusLabel, verified] = STATUS[org.status];

  return (
    <div className="page-enter flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-5">
        <CompanyLogoEditor org={org} />
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.025em]">{org.name}</h1>
              {org.status === "verified" && <Link href={`/companies/${org.id}`} className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">See your public page<ExternalLink className="size-3" /></Link>}
            </div>
            <p className="text-sm text-muted-foreground">{org.hood || "Add your neighbourhood"} · {projects.length} project{projects.length === 1 ? "" : "s"} · {issued} credential{issued === 1 ? "" : "s"} issued</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Status on={verified} yes={statusLabel} no={statusLabel} />
            <Status on={user.linkedinVerified} yes="LinkedIn verified" no="LinkedIn not connected" />
            <Status on={!!org.website} yes={org.website} no="No website" />
            <Status on={org.files.length > 0} yes={`${org.files.length} file${org.files.length === 1 ? "" : "s"} shared`} no="No files shared" />
          </div>
        </div>
      </div>

      {org.status !== "verified" && (
        <Link href="/company/verify" className="-mt-3 rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600 hover:border-zinc-400">
          Students only see verified companies’ projects. <span className="font-medium text-foreground underline underline-offset-4">{org.status === "pending" ? "Check your verification" : "Finish verification"}</span>
        </Link>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,21.25rem),1fr))] items-start gap-4">
        <CompanyDetailsCard user={user} org={org} />
        <CompanyFilesCard files={org.files} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Certificates issued <span className="font-mono text-sm font-normal text-muted-foreground">{issued}</span></h2>
          {unsigned > 0 && <span className="text-[0.8125rem] font-medium text-[#92400e]">{unsigned} waiting for your signature</span>}
        </div>
        {certificates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-sm text-muted-foreground">When you verify a student&apos;s work, the certificate you issue shows up here.</div>
        ) : (
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
            {certificates.map((c) => (
              <div key={c.credential.id} className="flex flex-col gap-2.5">
                <CredentialCard c={c.credential} />
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Earned by <span className="font-medium text-foreground">{c.student}</span></span>
                  <span>·</span>
                  {c.signedByCompany
                    ? <span className="inline-flex items-center gap-1 font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />Signed by you{c.signedByStudent ? ` and ${firstName(c.student)}` : ""}</span>
                    : <SignCertificateDialog credentialId={c.credential.id} as="company" project={c.credential.projectTitle} otherParty={firstName(c.student)} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Open projects <span className="font-mono text-sm font-normal text-muted-foreground">{open.length}</span></h2>
        {open.length === 0 ? <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-sm text-muted-foreground">No open projects right now.</div> : (
          <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4">{open.map((p) => <CompanyProjectCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
