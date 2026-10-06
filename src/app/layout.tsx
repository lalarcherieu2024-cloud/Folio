import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession, isOnboarding } from "@/lib/auth";
import { getNotifications } from "@/lib/data/notifications";
import { getCompanyNavCounts } from "@/lib/data/startup";
import { getStudentNavCounts } from "@/lib/data/student";

export const metadata: Metadata = {
  title: "Folio: real projects, verified proof",
  description: "Do paid projects for startups and small businesses. Every finished project becomes verified proof of your skills.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  const counts = !user ? null : user.role === "company" ? await getCompanyNavCounts(user) : await getStudentNavCounts(user).then((c) => ({ ...c }));
  // Collapsed by default; only someone who expanded it ("0") gets the full sidebar.
  const sidebarCollapsed = (await cookies()).get("folio_sidebar_v2")?.value !== "0";
  const notifications = user ? await getNotifications(user) : { items: [], unread: 0 };
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="min-h-full">
        <TooltipProvider>
          {/* Students still in onboarding see the public site, with a way back to their set-up. */}
          {user && counts && !isOnboarding(user) ? (
            <AppShell user={user} counts={counts} notifications={notifications} defaultCollapsed={sidebarCollapsed}>{children}</AppShell>
          ) : (
            <div className="flex min-h-screen flex-col overflow-x-clip">
              <SiteHeader onboarding={user && isOnboarding(user) ? { name: user.fullName, email: user.email } : undefined} />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          )}
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
