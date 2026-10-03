"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { StudentProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { NavCounts } from "./nav";

// Pages that draw their own full-screen layout (company verification) skip the sidebar and top bar.
const FULL_SCREEN = ["/company/verify"];

export function AppShell({ user, counts, children }: { user: StudentProfile; counts: NavCounts; children: React.ReactNode }) {
  const path = usePathname();
  if (FULL_SCREEN.some((p) => path.startsWith(p))) return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} counts={counts} />
      <div className={cn("flex min-w-0 flex-1 flex-col", user.role === "company" ? "bg-cream" : "bg-white")}>
        <Topbar user={user} counts={counts} />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-16 pt-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
