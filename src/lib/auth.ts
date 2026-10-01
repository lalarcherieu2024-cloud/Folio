// DEMO AUTH. The session cookie holds a bare user id and no password is checked,
// so anyone could forge it. It exists only so the UI flows can be built and tested.
// Phase 2 replaces this file with Supabase Auth (getUser() + RLS), and the rest of
// the app keeps calling getSession() / requireUser() unchanged.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./store";
import type { StudentProfile } from "./types";

const COOKIE = "folio_session";

export async function getSession(): Promise<StudentProfile | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  return (id && db.users.get(id)) || null;
}

export async function requireUser(next = "/"): Promise<StudentProfile> {
  const user = await getSession();
  if (!user) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return user;
}

export async function startSession(userId: string) {
  (await cookies()).set(COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}
