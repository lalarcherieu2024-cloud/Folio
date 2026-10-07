import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Folio: real projects, verified proof",
  description: "Startups and small businesses get work done by IE University students, at a fixed price. Students get paid, and every finished project becomes verified proof.",
};

// Only the document itself: the app or public frame is picked by each route group's layout (Frame), so it can't go
// stale when the session changes between client-side navigations.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="min-h-full">
        {/* Set NEXT_PUBLIC_APP_ENV=staging in the staging build so nobody mistakes it for the real site. */}
        {process.env.NEXT_PUBLIC_APP_ENV === "staging" && (
          <div className="bg-[#fef3c7] px-4 py-1.5 text-center text-xs font-medium text-[#92400e]">Staging: test data only. Payments are simulated and nothing here is real.</div>
        )}
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
