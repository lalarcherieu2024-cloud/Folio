"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";
import { removeProject, savePaypalEmail, startFunding, withdraw } from "@/lib/data/payments";
import { str, type FormState } from "@/lib/form";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

/** The company pays for a draft project. Returns a PayPal URL to go to, or `funded` when the payment is done. */
export async function startPaymentAction(projectId: string): Promise<{ url?: string; funded?: boolean; error?: string }> {
  const user = await requireUser(`/company/projects/${projectId}/pay`, "company");
  // Verification stage 2 (migration 0030): no payment without the registry extract and the representative's ID.
  const org = await getOrganization(user);
  if (!org || !["registry_extract", "representative_id"].every((k) => org.docs.some((d) => d.kind === k))) {
    return { error: "Upload the registry extract and the representative's ID first." };
  }
  const res = await startFunding(user, projectId, await origin());
  if (res.funded) { revalidatePath("/company", "layout"); revalidatePath("/projects"); }
  return res;
}

export async function savePaypalEmailAction(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/payments", "student");
  const res = await savePaypalEmail(user, str(f, "email"));
  if (res.error) return res;
  revalidatePath("/payments");
  return { ok: true };
}

export async function withdrawAction(): Promise<{ cents?: number; error?: string }> {
  const user = await requireUser("/payments", "student");
  const res = await withdraw(user);
  revalidatePath("/payments");
  return res;
}

/** Deletes a project that hasn't started (or cancels and refunds it if it was already paid). Used by companies for their own projects. */
export async function removeProjectAction(projectId: string): Promise<{ kind?: "deleted" | "cancelled"; error?: string }> {
  const user = await requireUser("/");
  const res = await removeProject(user, projectId);
  if (!res.error) {
    revalidatePath("/company", "layout");
    revalidatePath("/applications");
    revalidatePath("/projects");
    revalidatePath("/payments");
  }
  return res;
}
