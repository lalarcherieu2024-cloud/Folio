import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { Notification, StudentProfile } from "@/lib/types";
import type { NavCounts } from "./nav";

export function AppShell({ user, counts, notifications, children }: { user: StudentProfile; counts: NavCounts; notifications: { items: Notification[]; unread: number }; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <Topbar user={user} counts={counts} notifications={notifications} />
        <main className="mx-auto w-full max-w-[77.5rem] flex-1 px-4 pb-16 pt-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
