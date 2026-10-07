"use server";

// Admin-only server actions (/admin). Every one checks the signed-in account first.
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { decideCompany } from "@/lib/data/admin";
import { UUID } from "@/lib/data/shared";
import type { FormState } from "@/lib/form";

export async function approveCompanyAction(orgId: string): Promise<FormState> {
  await requireAdmin();
  if (!UUID.test(orgId)) return { error: "Company not found." };
  const res = await decideCompany(orgId, true, "");
  if (res.error) return res;
  revalidatePath("/admin");
  return { ok: true };
}

export async function requestChangesAction(orgId: string, note: string): Promise<FormState> {
  await requireAdmin();
  if (!UUID.test(orgId)) return { error: "Company not found." };
  const text = note.trim();
  if (text.length < 10) return { error: "Say what needs changing (at least 10 characters); the company sees this note." };
  const res = await decideCompany(orgId, false, text.slice(0, 500));
  if (res.error) return res;
  revalidatePath("/admin");
  return { ok: true };
}
