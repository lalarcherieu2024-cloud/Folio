import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Sign in · Folio" };

export default async function SignIn({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  return <div className="mx-auto w-full max-w-md px-6 py-16"><AuthForm mode="signin" next={typeof sp.next === "string" ? sp.next : undefined} /></div>;
}
