import { redirect } from "next/navigation";
import { UnfinishedSignupScreen } from "@/components/shared/UnfinishedSignup";
import { StudentSignup } from "@/components/student/StudentSignup";
import { getSession } from "@/lib/auth";
import { getUnfinishedSignup } from "@/lib/data/signup";
import { homeFor } from "@/lib/routes";

export const metadata = { title: "Create account · Folio" };

export default async function SignUp({ searchParams }: PageProps<"/signup">) {
  const user = await getSession();
  // Partway through a sign-up already: continue it, or start from scratch (instead of silently bouncing back).
  const unfinished = await getUnfinishedSignup(user);
  if (unfinished) return <UnfinishedSignupScreen signup={unfinished} to="student" />;
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  if (sp.role === "company") redirect("/company/signup"); // companies have their own sign-up screen
  return <StudentSignup />;
}
