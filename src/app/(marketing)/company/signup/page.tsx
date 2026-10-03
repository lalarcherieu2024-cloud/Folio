import { redirect } from "next/navigation";
import { CompanyAuth } from "@/components/startup/CompanyAuth";
import { getSession } from "@/lib/auth";
import { homeFor } from "@/lib/routes";

export const metadata = { title: "Create a company account · Folio" };

export default async function CompanySignUp() {
  const user = await getSession();
  if (user) redirect(homeFor(user.role));
  return <CompanyAuth mode="signup" />;
}
