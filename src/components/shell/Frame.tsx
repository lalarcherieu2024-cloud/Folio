import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/AppShell";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getSession, isOnboarding } from "@/lib/auth";
import { getNotifications } from "@/lib/data/notifications";
import { getCompanyNavCounts, getOrganization } from "@/lib/data/startup";
import { getStudentNavCounts } from "@/lib/data/student";

// The frame around a page: the signed-in app (sidebar) or the public site (header and footer), picked from the session.
// Each route group's layout renders it, not the root layout: the client router keeps a layout while you move between
// pages under it, so a frame picked once at the root went stale whenever the session changed without a full page load
// (e.g. a signed-in user opening /signup was redirected to /home inside the signed-out header). Moving between the
// public site, the student pages and the company pages now always renders the frame again.
export async function Frame({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const counts = !user ? null : user.role === "company" ? await getCompanyNavCounts(user) : await getStudentNavCounts(user).then((c) => ({ ...c }));
  // Collapsed by default; only someone who expanded it ("0") gets the full sidebar.
  const sidebarCollapsed = (await cookies()).get("folio_sidebar_v2")?.value !== "0";
  const notifications = user ? await getNotifications(user) : { items: [], unread: 0 };
  // Students still in onboarding see the public site, with a way back to their set-up.
  if (user && counts && !isOnboarding(user)) {
    // Company accounts show the company (name and logo) in the account menu, not the person who signed in.
    const org = user.role === "company" ? await getOrganization(user) : null;
    const account = org ? { name: org.name || user.fullName, url: org.logoUrl, color: org.logoColor } : undefined;
    return <AppShell user={user} account={account} counts={counts} notifications={notifications} defaultCollapsed={sidebarCollapsed}>{children}</AppShell>;
  }
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <SiteHeader onboarding={user && isOnboarding(user) ? { name: user.fullName, email: user.email } : undefined} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
