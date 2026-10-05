/* eslint-disable @next/next/no-img-element -- signatures are inline PNG data URLs, which next/image cannot optimise */
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UUID } from "@/lib/data/shared";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Verify a credential · Folio" };

// Public page: anyone holding a certificate can check here that Folio really issued it.
// Only what is printed on the certificate is shown; the credential id is an unguessable link.
export default async function VerifyCredential(props: PageProps<"/verify/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const admin = createAdminClient();
  const { data: c } = await admin.from("credential_cards").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: s } = await admin.from("profiles").select("full_name").eq("id", c.student_id).maybeSingle();
  const { data: sig } = await admin.from("credentials").select("client_signature, client_signer, client_signed_at, student_signature, student_signed_at").eq("id", id).maybeSingle();
  const signed = (when?: string | null) => (when ? new Date(when).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);
  const issued = new Date(c.issued_at).toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-6 py-16">
      <div className="flex items-center gap-2 rounded-lg bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#166534]">
        <Check className="size-4" strokeWidth={3} />This credential is genuine. Folio issued it on {issued}.
      </div>
      <article className="flex flex-col gap-3 rounded-xl border bg-white p-6 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
        <span className="text-[0.8125rem] text-muted-foreground">Certificate of verified work</span>
        <h1 className="text-2xl font-semibold tracking-tight">{s?.full_name ?? "A Folio student"}</h1>
        <p className="text-[0.9375rem]">completed <b className="font-semibold">{c.project_title}</b> for {c.org_name ?? c.client_name}{c.hood ? `, ${c.hood}` : ""}.</p>
        <p className="text-sm italic text-zinc-600">“{c.review}”</p>
        <div className="flex items-center justify-between border-t pt-3 text-[0.8125rem]">
          <span className="font-medium text-[#16a34a]">Verified by {c.org_name ?? c.client_name}</span>
          <span className="flex gap-0.5" aria-label={`${c.rating} out of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3.5 ${i < c.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-zinc-300"}`} />)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          {([[sig?.client_signature, sig?.client_signer ?? "Authorised signatory", `For ${c.org_name ?? c.client_name}`, sig?.client_signed_at], [sig?.student_signature, s?.full_name ?? "Student", "Student", sig?.student_signed_at]] as const).map(([img, who, role, at]) => (
            <div key={role} className="flex flex-col gap-1">
              <div className="flex h-12 items-end">{img ? <img src={img} alt={`Signature of ${who}`} className="max-h-12 w-auto object-contain" /> : null}</div>
              <div className="border-t border-zinc-400 pt-1 text-[0.8125rem] font-medium">{who}</div>
              <span className="text-xs text-muted-foreground">{role} · {signed(at) ? `Signed ${signed(at)}` : "Awaiting signature"}</span>
            </div>
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">Credential ID {c.id}</span>
      </article>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">What is Folio?</Link>
    </div>
  );
}
