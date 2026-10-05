"use client";

import { PenLine } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signCertificateAsCompanyAction, signCertificateAsStudentAction } from "@/app/actions/signatures";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** "Sign certificate": the company signs first, then the student. A signature can't be changed afterwards. */
export function SignCertificateDialog({ credentialId, as, project, otherParty, size = "sm" }: { credentialId: string; as: "company" | "student"; project: string; otherParty: string; size?: "sm" | "default" }) {
  const [open, setOpen] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function save() {
    if (!sig) return;
    start(async () => {
      const r = await (as === "company" ? signCertificateAsCompanyAction : signCertificateAsStudentAction)(credentialId, sig);
      if (r.error) { toast.error(r.error); return; }
      toast.success("Certificate signed", { description: as === "company" ? `${otherParty} is asked to add their signature next.` : "Your signature is now on the certificate." });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { setOpen(o); if (!o) setSig(null); } }}>
      <DialogTrigger render={<Button size={size} className="h-8 gap-1.5 px-3 text-[0.8125rem]" />}><PenLine className="size-3.5" />Sign certificate</DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[30rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Sign the certificate</DialogTitle>
          <DialogDescription>
            {as === "company"
              ? `You confirm that ${otherParty} completed “${project}”. Your signature appears on their certificate. ${otherParty} signs it next.`
              : `Add your signature to your certificate for “${project}”, next to ${otherParty}'s.`} A signature can&apos;t be changed once saved.
          </DialogDescription>
        </DialogHeader>
        <SignaturePad onChange={setSig} disabled={busy} />
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={!sig || busy} onClick={save}>{busy ? "Saving…" : "Save signature"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
