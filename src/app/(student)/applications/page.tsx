import { WorkTabs } from "@/components/student/WorkTabs";
import { requireUser } from "@/lib/auth";
import { getApplications, getProjectsPostedBy } from "@/lib/data/student";
import { getLatestSubmissions } from "@/lib/data/submissions";

export const metadata = { title: "My work · Folio" };

export default async function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  const sp = await searchParams;
  const user = await requireUser("/applications", "student");
  const [apps, requests] = await Promise.all([getApplications(user), getProjectsPostedBy(user)]);
  const submissions = await getLatestSubmissions(apps.map((a) => a.id));
  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">My work</h1>
        <p className="text-[0.9375rem] text-muted-foreground">Track each project from application to verified credential.</p>
      </div>
      <WorkTabs apps={apps} requests={requests} tab={sp.tab === "requests" ? "requests" : sp.tab === "past" ? "past" : "applications"} posted={sp.posted === "1"} userId={user.id} submissions={submissions} />
    </div>
  );
}
