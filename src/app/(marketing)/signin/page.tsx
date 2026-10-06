import { AuthForm } from "@/components/marketing/AuthForm";

export const metadata = { title: "Sign in · Folio" };

// One sign-in for students and companies; ?as=company preselects the Company switch.
export default async function SignIn({ searchParams }: PageProps<"/signin">) {
  const sp = await searchParams;
  const error = sp.error === "linkedin" ? "LinkedIn sign-in didn't finish. Try again, or sign in with your email." : undefined;
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16">
      {sp.error === "link" && (
        // A confirmation link that expired or was opened in another browser. The email is usually confirmed
        // already, so signing in picks up where sign-up left off (students go back to their onboarding).
        <p role="status" className="rounded-lg border border-brand-low bg-soft/60 px-4 py-3 text-sm text-zinc-700">
          That link couldn&apos;t sign you in here, often because it was opened in a different browser. Your email is probably confirmed already: sign in below to continue setting up your account.
        </p>
      )}
      <AuthForm mode="signin" role={sp.as === "company" ? "company" : "student"} next={typeof sp.next === "string" ? sp.next : undefined} error={error} />
    </div>
  );
}
