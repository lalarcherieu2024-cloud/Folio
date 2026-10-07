import { isOnboarding } from "../auth";
import { createAdminClient } from "../supabase/admin";
import type { Role, StudentProfile } from "../types";
import { getOrganization } from "./startup";

// An account that started signing up but hasn't finished: a student without the required profile photo, or a
// company that hasn't submitted its verification. Whenever it starts a new sign-up it's asked whether to continue
// or start from scratch (UnfinishedSignup), and while setting up it always has a way out (header, AuthFrame).
export type UnfinishedSignup = { email: string; role: Role; continueHref: string; canStartOver: boolean };

export async function getUnfinishedSignup(user: StudentProfile | null): Promise<UnfinishedSignup | null> {
  if (!user) return null;
  if (user.role === "student" ? !isOnboarding(user) : await submittedCompany(user)) return null;
  return {
    email: user.email,
    role: user.role,
    continueHref: user.role === "company" ? "/company/verify" : "/welcome",
    canStartOver: !(await hasActivity(user.id)),
  };
}

async function submittedCompany(user: StudentProfile) {
  const org = await getOrganization(user);
  return org?.status === "pending" || org?.status === "verified";
}

// Rows another user could depend on. They don't delete with the account (no cascade on these foreign keys), so an
// account with any of them is never deleted by "start from scratch"; it can still sign out.
const ACTIVITY = [
  ["projects", "client_id"], ["applications", "student_id"], ["credentials", "student_id"], ["messages", "sender_id"],
  ["withdrawals", "student_id"], ["escrows", "payer_id"], ["escrows", "student_id"],
] as const;

// A table that doesn't exist yet (its migration hasn't been run) simply has no rows.
const MISSING_TABLE = new Set(["42P01", "PGRST205"]);

/** Deleting an account needs the service-role key. Without it (e.g. a local setup) nobody can start over. */
export const canDeleteAccounts = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function hasActivity(userId: string) {
  if (!canDeleteAccounts()) return true; // can't check (or delete), so treat it as not deletable
  const admin = createAdminClient();
  const results = await Promise.all(ACTIVITY.map(([table, column]) => admin.from(table).select("*", { count: "exact", head: true }).eq(column, userId)));
  // Any other error counts as activity: when in doubt, nothing gets deleted.
  return results.some((r) => (r.error ? !MISSING_TABLE.has(r.error.code ?? "") : (r.count ?? 0) > 0));
}
