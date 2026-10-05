import { redirect } from "next/navigation";
import { AuthForm } from "@/components/marketing/AuthForm";

export const metadata = { title: "Create account · Folio" };

export default async function SignUp({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  if (sp.role === "company") redirect("/company/signup"); // companies have their own sign-up screen
  return <div className="mx-auto w-full max-w-md px-6 py-16"><AuthForm mode="signup" /></div>;
}
