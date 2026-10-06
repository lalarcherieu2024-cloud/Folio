"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import type { Notification, StudentProfile } from "@/lib/types";
import type { NavCounts } from "./nav";
import { LegalLinks } from "@/components/marketing/SiteFooter";

// Pages that draw their own full-screen layout (company verification, student onboarding) skip the sidebar and top bar.
const FULL_SCREEN = ["/company/verify", "/welcome"];

// Pages that need the width (the project browser) start with the sidebar collapsed to icons.
const AUTO_COLLAPSE = ["/projects"];

// Holds the one piece of shell state: is the sidebar collapsed to icons? The choice is kept in a cookie,
// so the server renders the right width on the next page load (no flash of the wrong size).
export function AppShell({ user, counts, notifications, defaultCollapsed, children }: {
  user: StudentProfile; counts: NavCounts; notifications: { items: Notification[]; unread: number }; defaultCollapsed: boolean; children: React.ReactNode;
}) {
  const path = usePathname();
  const [saved, setSaved] = useState(defaultCollapsed);
  // On auto-collapse pages the sidebar is collapsed unless opened on this very page; that choice isn't saved,
  // so the visitor's own preference comes back everywhere else.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const auto = AUTO_COLLAPSE.some((p) => path.startsWith(p));
  const collapsed = auto ? openedOn !== path : saved;

  const toggle = useCallback(() => {
    if (auto) { setOpenedOn(collapsed ? path : null); return; }
    const next = !saved;
    setSaved(next);
    document.cookie = `folio_sidebar_v2=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }, [auto, collapsed, path, saved]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  if (FULL_SCREEN.some((p) => path.startsWith(p))) return <>{children}</>;
  return (
    // Companies get a calmer, more formal workspace than students (see [data-tone="pro"] in globals.css).
    <div className="flex min-h-screen" data-tone={user.role === "company" ? "pro" : undefined}>
      <Sidebar user={user} counts={counts} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <Topbar user={user} counts={counts} notifications={notifications} sidebarCollapsed={collapsed} onToggleSidebar={toggle} />
        <main className="mx-auto w-full max-w-[77.5rem] flex-1 px-4 pb-16 pt-8 md:px-8">
          {children}
          <LegalLinks className="mt-16 border-t pt-6 text-xs text-muted-foreground" />
        </main>
      </div>
    </div>
  );
}
