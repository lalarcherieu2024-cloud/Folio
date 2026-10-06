import { redirect } from "next/navigation";
import { UnfinishedSignupScreen } from "@/components/shared/UnfinishedSignup";
import { CompanyAuth } from "@/components/startup/CompanyAuth";
import { getSession } from "@/lib/auth";
import { getUnfinishedSignup } from "@/lib/data/signup";
import { homeFor } from "@/lib/routes";

export const metadata = { title: "Create a company account · Folio" };

export default async function CompanySignUp() {
  const user = await getSession();
  // Partway through a sign-up already (e.g. as a student by mistake): continue it, or start from scratch as a company.
  const unfinished = await getUnfinishedSignup(user);
  if (unfinished) return <UnfinishedSignupScreen signup={unfinished} to="company" />;
  if (user) redirect(homeFor(user.role));
  return <CompanyAuth mode="signup" />;
}
