import { redirect } from "next/navigation";
import { Landing } from "@/components/marketing/Landing";
import { getSession, isOnboarding } from "@/lib/auth";
import { getCategoryCounts, getOpenProjects } from "@/lib/data/projects";
import { homeFor } from "@/lib/routes";

// "/" is the public front page. Signed-in accounts go straight to their own home.
export default async function Front() {
  const user = await getSession();
  if (user && !isOnboarding(user)) redirect(homeFor(user.role)); // mid-sign-up students may still look around
  const [projects, counts] = await Promise.all([getOpenProjects(), getCategoryCounts()]);
  return <Landing projects={projects} counts={counts} />;
}
