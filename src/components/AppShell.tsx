import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { StudentProfile } from "@/lib/types";

export function AppShell({ user, counts, children }: { user: StudentProfile; counts: { open: number; mine: number }; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <Topbar user={user} counts={counts} />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
