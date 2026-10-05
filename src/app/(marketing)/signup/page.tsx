import { redirect } from "next/navigation";
import { StudentSignup } from "@/components/student/StudentSignup";
import { getSession } from "@/lib/auth";
import { homeFor } from "@/lib/routes";

export const metadata = { title: "Create account · Folio" };

export default async function SignUp({ searchParams }: PageProps<"/signup">) {
  const user = await getSession();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  if (sp.role === "company") redirect("/company/signup"); // companies have their own sign-up screen
  return <StudentSignup />;
}
