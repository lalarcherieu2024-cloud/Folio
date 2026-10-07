import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";
import type { StudentProfile } from "./types";

// Who can open the admin page (/admin): the accounts listed in ADMIN_EMAILS (comma-separated). In development, with
// no list set, anyone signed in can, so it works out of the box locally; a deployed site needs the list.
const ADMINS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const adminOpenForAll = ADMINS.length === 0 && process.env.NODE_ENV !== "production";

export const isAdmin = (user: StudentProfile | null) => !!user && (adminOpenForAll || ADMINS.includes(user.email.toLowerCase()));

/** The signed-in admin; anyone else gets a plain 404, so the page doesn't advertise itself. */
export async function requireAdmin(): Promise<StudentProfile> {
  const user = await requireUser("/admin");
  if (!isAdmin(user)) notFound();
  return user;
}
