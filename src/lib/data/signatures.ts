// E-signatures on certificates (migration 0021). The company signs first, then the student.
import { createClient } from "../supabase/server";
import { UUID } from "./shared";

export type SignatureState = {
  credentialId: string;
  clientSigner: string | null;
  clientSignedAt: string | null;
  studentSignedAt: string | null;
};

const NEEDS_MIGRATION = "Signatures need migration 0021. Run supabase/migrations/0021_signatures.sql in the Supabase SQL Editor.";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Who has signed which certificate. Images are not loaded here, only the facts. Empty until migration 0021 is run. */
export async function getSignatureStates(credentialIds: string[]): Promise<Record<string, SignatureState>> {
  if (credentialIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("credentials").select("id, client_signer, client_signed_at, student_signed_at").in("id", credentialIds);
  return Object.fromEntries((data ?? []).map((r: any) => [r.id, { credentialId: r.id, clientSigner: r.client_signer, clientSignedAt: r.client_signed_at, studentSignedAt: r.student_signed_at }]));
}

/** The certificate issued for a project, with its signature facts (for the company that issued it). */
export async function getCredentialForProject(projectId: string): Promise<SignatureState | null> {
  if (!UUID.test(projectId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("credentials").select("id, client_signer, client_signed_at, student_signed_at").eq("project_id", projectId).maybeSingle();
  return data ? { credentialId: data.id, clientSigner: data.client_signer ?? null, clientSignedAt: data.client_signed_at ?? null, studentSignedAt: data.student_signed_at ?? null } : null;
}

async function sign(fn: "sign_credential_as_client" | "sign_credential_as_student", credentialId: string, signature: string): Promise<{ error?: string }> {
  if (!UUID.test(credentialId)) return { error: "Certificate not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_credential: credentialId, p_signature: signature });
  if (!error) return {};
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "PGRST202" || error.code === "42883") return { error: NEEDS_MIGRATION };
  console.error(fn, error);
  return { error: "Couldn't save your signature. Try again." };
}

export const signAsClient = (credentialId: string, signature: string) => sign("sign_credential_as_client", credentialId, signature);
export const signAsStudent = (credentialId: string, signature: string) => sign("sign_credential_as_student", credentialId, signature);
