import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession } from "@/lib/auth";
import { getNavCounts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Folio: real projects, verified proof",
  description: "Do paid projects for startups and fellow students. Every finished project becomes verified proof of your skills.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSession();
  const counts = user ? await getNavCounts(user) : null;
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="min-h-full">
        <TooltipProvider>
          {user && counts ? (
            <AppShell user={user} counts={counts}>{children}</AppShell>
          ) : (
            <div className="flex min-h-screen flex-col overflow-x-clip">
              <SiteHeader />
              <main className="flex-1">{children}</main>
            </div>
          )}
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
