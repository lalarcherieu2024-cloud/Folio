import { buildCertificate } from "@/lib/certificate";
import { UUID } from "@/lib/data/shared";
import { createClient } from "@/lib/supabase/server";

// The student's own verified credential as a PDF, to keep or to attach on LinkedIn.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });

  // Only the person the credential was issued to can download it.
  const { data: c } = await supabase.from("credential_cards").select("*").eq("id", id).eq("student_id", user.id).maybeSingle();
  if (!c) return new Response("Not found", { status: 404 });
  // Signatures live on the credentials table itself (migration 0021); before it exists this is simply empty.
  const { data: sig } = await supabase.from("credentials").select("client_signature, client_signer, client_signed_at, student_signature, student_signed_at").eq("id", id).maybeSingle();
  const { data: p } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  const issuedAt = new Date(c.issued_at).toLocaleString("en-GB", { month: "long", year: "numeric" });
  const pdf = await buildCertificate({
    studentName: p?.full_name ?? "Folio student", projectTitle: c.project_title, client: c.org_name ?? c.client_name, hood: c.hood ?? "",
    rating: c.rating, review: c.review, issuedAt, credentialId: c.id, verifyUrl: `${new URL(request.url).origin}/verify/${c.id}`,
    clientSignature: sig?.client_signature, clientSigner: sig?.client_signer, clientSignedAt: sig?.client_signed_at,
    studentSignature: sig?.student_signature, studentSignedAt: sig?.student_signed_at,
  }, new URL(request.url).origin);
  const slug = String(c.project_title).normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "project";
  return new Response(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Folio-certificate-${slug}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
