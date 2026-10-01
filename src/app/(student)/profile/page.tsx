import { Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CredentialCard } from "@/components/shared/CredentialCard";
import { CvCard, LinksCard } from "@/components/student/ProfileCards";
import { initials } from "@/components/shell/Sidebar";
import { requireUser } from "@/lib/auth";
import { getCredentials } from "@/lib/data/student";

export const metadata = { title: "Profile & record · Folio" };

function Status({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return on
    ? <Badge className="h-[22px] gap-1 rounded-md bg-[#dcfce7] px-2 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]"><Check className="size-3" strokeWidth={3} />{yes}</Badge>
    : <Badge variant="outline" className="h-[22px] rounded-md px-2 text-xs font-medium text-muted-foreground">{no}</Badge>;
}

export default async function ProfilePage() {
  const me = await requireUser("/profile", "student");
  const creds = await getCredentials(me);
  return (
    <div className="page-enter flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-5">
        <span className="grid size-[72px] place-items-center rounded-[14px] bg-zinc-200 text-2xl font-semibold">{initials(me.fullName)}</span>
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-[28px] font-semibold tracking-[-0.025em]">{me.fullName}</h1>
            <p className="text-sm text-muted-foreground">{me.program || "Add your programme"} · {creds.length} credential{creds.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Status on={me.uniEmailVerified} yes="University email verified" no="Student email not verified" />
            <Status on={!!me.cv} yes="CV uploaded" no="CV needed to apply" />
            <Status on={false} yes="" no={me.githubHandle ? `GitHub @${me.githubHandle} · unverified` : "GitHub not linked"} />
            <Status on={false} yes="" no={me.linkedinUrl ? "LinkedIn · unverified" : "LinkedIn not linked"} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
        <CvCard cv={me.cv} />
        <LinksCard user={me} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Verified record</h2>
        <div className="stagger grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {creds.map((c) => <CredentialCard key={c.id} c={c} />)}
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-muted-foreground">
            <Plus className="size-5" /><span className="font-medium text-foreground">Next credential</span><span>Finish a project and the client signs it here.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
