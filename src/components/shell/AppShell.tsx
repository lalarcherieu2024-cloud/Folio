"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { Notification, StudentProfile } from "@/lib/types";
import type { NavCounts } from "./nav";

// Holds the one piece of shell state: is the sidebar collapsed to icons? The choice is kept in a cookie,
// so the server renders the right width on the next page load (no flash of the wrong size).
export function AppShell({ user, counts, notifications, defaultCollapsed, children }: {
  user: StudentProfile; counts: NavCounts; notifications: { items: Notification[]; unread: number }; defaultCollapsed: boolean; children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `folio_sidebar=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} counts={counts} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <Topbar user={user} counts={counts} notifications={notifications} sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
        <main className="mx-auto w-full max-w-[77.5rem] flex-1 px-4 pb-16 pt-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
