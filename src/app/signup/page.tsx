import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Create account · Folio" };

export default function SignUp() {
  return <div className="mx-auto max-w-md"><AuthForm mode="signup" /></div>;
}
