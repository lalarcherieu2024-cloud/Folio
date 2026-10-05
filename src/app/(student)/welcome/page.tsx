import { StudentOnboarding, type OnboardingStep } from "@/components/student/StudentOnboarding";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Set up your profile · Folio" };

// Student sign-up steps 3–6, after the account and email exist (mirrors /company/verify).
export default async function Welcome({ searchParams }: PageProps<"/welcome">) {
  const user = await requireUser("/welcome", "student");
  const asked = Number((await searchParams).step);
  const step = ([3, 4, 5, 6].includes(asked) ? asked : 3) as OnboardingStep;
  return <StudentOnboarding step={step} user={user} />;
}
