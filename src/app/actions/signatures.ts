"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { signAsClient, signAsStudent } from "@/lib/data/signatures";
import type { FormState } from "@/lib/form";

const looksLikeSignature = (s: string) => typeof s === "string" && s.startsWith("data:image/png;base64,") && s.length < 200_000;

export async function signCertificateAsCompanyAction(credentialId: string, signature: string): Promise<FormState> {
  await requireUser("/company/applicants", "company");
  if (!looksLikeSignature(signature)) return { error: "Draw or type your signature first." };
  const res = await signAsClient(credentialId, signature);
  if (res.error) return res;
  revalidatePath("/company", "layout");
  revalidatePath("/profile");
  return { ok: true };
}

export async function signCertificateAsStudentAction(credentialId: string, signature: string): Promise<FormState> {
  await requireUser("/profile", "student");
  if (!looksLikeSignature(signature)) return { error: "Draw or type your signature first." };
  const res = await signAsStudent(credentialId, signature);
  if (res.error) return res;
  revalidatePath("/profile");
  return { ok: true };
}
