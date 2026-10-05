"use server";

// Messages between a company and the student it hired. Used by both sides.
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sendMessage } from "@/lib/data/messages";
import { str, type FormState } from "@/lib/form";

export async function sendMessageAction(applicationId: string, _: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser(`/applications/${applicationId}`);
  const res = await sendMessage(user, applicationId, str(f, "body"));
  if (res.error) return res;
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath(`/company/applicants/${applicationId}`);
  return { ok: true };
}
