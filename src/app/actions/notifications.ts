"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markAllRead } from "@/lib/data/notifications";

// Works for students and companies alike (no role argument), and refreshes the bell everywhere.
export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser("/");
  await markAllRead(user);
  revalidatePath("/", "layout");
}
