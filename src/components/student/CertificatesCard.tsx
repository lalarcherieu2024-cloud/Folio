"use client";

import { Award, ExternalLink, FileText, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addCertificateAction, deleteCertificateAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import type { CourseCertificate } from "@/lib/types";
import { cn } from "@/lib/utils";

// Certificates from courses outside Folio. Suggestions only: any issuer can be typed.
const ISSUERS = ["Coursera", "Udemy", "edX", "Programiz", "freeCodeCamp", "Codecademy", "DataCamp", "LinkedIn Learning", "Google", "Microsoft Learn", "AWS", "HubSpot Academy", "Khan Academy", "IE University"];

const month = (ym: string | null) => (ym ? new Date(`${ym}-01T00:00:00`).toLocaleString("en-GB", { month: "short", year: "numeric" }) : null);

/** One certificate, as students and clients see it. */
export function CertificateRow({ c, onRemove, removing }: { c: CourseCertificate; onRemove?: () => void; removing?: boolean }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-white p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-brand"><Award className="size-4" /></span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold leading-snug">{c.title}</span>
        <span className="text-xs text-muted-foreground">{c.issuer}{month(c.issuedOn) && ` · ${month(c.issuedOn)}`}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">View credential <ExternalLink className="size-3" /></a>}
          {c.file?.url && <a href={c.file.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 font-medium text-brand hover:underline"><FileText className="size-3 shrink-0" /><span className="truncate">{c.file.name}</span></a>}
        </div>
      </div>
      {onRemove && (
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={removing} aria-label={`Remove ${c.title}`} className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </li>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addCertificateAction, {});
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) { toast.success("Certificate added"); onDone(); }
    if (state.error) toast.error(state.error);
  }, [state, onDone]);
  return (
    <form action={action} className="grid gap-3 rounded-lg border bg-panel p-4">
      <div className="grid gap-1.5"><Label htmlFor="cert-title">Course or certificate</Label><Input id="cert-title" name="title" required maxLength={120} placeholder="e.g. Learn Python, Google Data Analytics" className="h-9 bg-white" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cert-issuer">Issued by</Label>
          <Input id="cert-issuer" name="issuer" required maxLength={80} list="cert-issuers" placeholder="e.g. Programiz" className="h-9 bg-white" />
          <datalist id="cert-issuers">{ISSUERS.map((i) => <option key={i} value={i} />)}</datalist>
        </div>
        <div className="grid gap-1.5"><Label htmlFor="cert-date">Month completed <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="cert-date" name="issuedOn" type="month" className="h-9 bg-white" /></div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cert-url">Link to the credential</Label>
        <Input id="cert-url" name="credentialUrl" type="url" placeholder="https://…" className="h-9 bg-white" />
        <span className="text-xs text-muted-foreground">The issuer&apos;s verify or share page, so clients can check it&apos;s real.</span>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cert-file">Or upload a copy</Label>
        <Input id="cert-file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="h-9 bg-white text-sm" />
        <span className="text-xs text-muted-foreground">PDF or image, up to 5 MB. Add a link, a file, or both.</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} className="h-9 px-3">Cancel</Button>
        <Button type="submit" disabled={pending} className="h-9 px-3.5">{pending ? "Saving…" : "Add certificate"}</Button>
      </div>
    </form>
  );
}

/** Profile card: showcase and manage certificates from other courses and websites. */
export function CertificatesCard({ certificates }: { certificates: CourseCertificate[] }) {
  const [adding, setAdding] = useState(false);
  const [removing, startRemove] = useTransition();
  const remove = (id: string) => startRemove(async () => {
    const r = await deleteCertificateAction(id);
    if (r.error) toast.error(r.error); else toast("Certificate removed");
  });
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold">Certificates <span className="font-normal text-muted-foreground">(optional)</span></span>
          <span className="text-[0.8125rem] text-muted-foreground">Courses you finished elsewhere, like Coursera, Udemy or Programiz. Clients see them when you apply.</span>
        </div>
        <Button type="button" variant={adding ? "ghost" : "outline"} size="sm" onClick={() => setAdding(!adding)} className={cn("h-8 shrink-0 gap-1.5 px-3 text-[0.8125rem]", !adding && "bg-white")}>
          {adding ? <><X className="size-3.5" />Close</> : <><Plus className="size-3.5" />Add</>}
        </Button>
      </div>
      {adding && <AddForm onDone={() => setAdding(false)} />}
      {certificates.length > 0
        ? <ul className="flex flex-col gap-2">{certificates.map((c) => <CertificateRow key={c.id} c={c} onRemove={() => remove(c.id)} removing={removing} />)}</ul>
        : !adding && <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-[0.8125rem] text-muted-foreground">No certificates yet. Add one to show what you&apos;ve learned outside class.</p>}
    </section>
  );
}
