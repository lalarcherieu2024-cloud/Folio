import { redirect } from "next/navigation";
import { CompanyAuth } from "@/components/startup/CompanyAuth";
import { getSession } from "@/lib/auth";
import { homeFor } from "@/lib/routes";

export const metadata = { title: "Sign in · Folio for companies" };

export default async function CompanySignIn({ searchParams }: PageProps<"/company/signin">) {
  const user = await getSession();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return <CompanyAuth mode="signin" next={typeof sp.next === "string" ? sp.next : undefined} />;
}
