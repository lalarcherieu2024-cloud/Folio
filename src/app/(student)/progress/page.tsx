import { ActivityHeatmap } from "@/components/student/ActivityHeatmap";
import { Milestones } from "@/components/student/Milestones";
import { requireUser } from "@/lib/auth";
import { getActivityDates, getCredentials } from "@/lib/data/student";

export const metadata = { title: "Progress · Folio" };

export default async function ProgressPage() {
  const user = await requireUser("/progress", "student");
  const [creds, activity] = await Promise.all([getCredentials(user), getActivityDates(user)]);
  return (
    <div className="page-enter flex flex-col gap-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Progress</h1>
        <p className="max-w-[60ch] text-[0.9375rem] text-muted-foreground">How your work adds up: your activity week by week, and the milestones you&apos;ve earned.</p>
      </div>
      <ActivityHeatmap dates={activity} />
      <Milestones creds={creds} />
    </div>
  );
}
