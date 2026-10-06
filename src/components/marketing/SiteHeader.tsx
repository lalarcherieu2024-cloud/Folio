"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

// Jump links into the "How Folio works" section on the front page.
const NAV = [["/#getting-paid", "Getting paid"], ["/#hiring", "Hiring"], ["/#trust", "Trust & accountability"]] as const;

// Header for signed-out visitors. Hidden on the company pages and student sign-up, which have their own full-screen layout.
export function SiteHeader({ onboarding = false }: { onboarding?: boolean }) {
  const path = usePathname();
  if (path.startsWith("/company/") || path === "/signup" || path.startsWith("/welcome")) return null;
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[75rem] items-center gap-2 px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Folio home">
          <Logo size={64} />
          <span className="text-2xl font-semibold tracking-tight">Folio</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          {NAV.map(([href, label]) => <Link key={href} href={href} className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-zinc-600")}>{label}</Link>)}
        </nav>
        <div className="flex-1" />
        {onboarding ? (
          // Signed in but sign-up isn't finished: one way back into the steps.
          <Link href="/welcome" className={cn(buttonVariants(), "h-9 px-3.5")}>Continue setting up</Link>
        ) : <>
          <Link href="/signin" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3.5")}>Sign in</Link>
          <Link href="/signup" className={cn(buttonVariants(), "h-9 px-3.5")}>Create account</Link>
        </>}
      </div>
    </header>
  );
}
