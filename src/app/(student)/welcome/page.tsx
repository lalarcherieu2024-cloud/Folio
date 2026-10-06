import { StudentOnboarding, type OnboardingStep } from "@/components/student/StudentOnboarding";
import { needsIeEmail, requireUser } from "@/lib/auth";
import { getUnfinishedSignup } from "@/lib/data/signup";

export const metadata = { title: "Set up your profile · Folio" };

// Student sign-up steps 3–6, after the account and email exist (mirrors /company/verify).
export default async function Welcome({ searchParams }: PageProps<"/welcome">) {
  const user = await requireUser("/welcome", "student");
  const asked = Number((await searchParams).step);
  // The profile photo is required: later steps aren't reachable without one.
  // A confirmed IE email comes first (needsIeEmail), and nothing after it is reachable without one.
  const step = (needsIeEmail(user) ? 2 : user.avatarUrl && [3, 4, 5, 6].includes(asked) ? asked : 3) as OnboardingStep;
  return <StudentOnboarding step={step} user={user} account={(await getUnfinishedSignup(user)) ?? undefined} />;
}
