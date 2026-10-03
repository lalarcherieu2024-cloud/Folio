"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

// Header for signed-out visitors. Hidden on the company sign-in pages, which have their own full-screen layout.
export function SiteHeader() {
  const path = usePathname();
  if (path.startsWith("/company/")) return null;
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Folio home">
          <Logo size={44} />
          <span className="text-lg font-semibold tracking-tight">Folio</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          <Link href="/#how" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-zinc-600")}>How it works</Link>
          <Link href="/#projects" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-zinc-600")}>Projects</Link>
          <Link href="/company/signin" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-zinc-600")}>For startups</Link>
        </nav>
        <div className="flex-1" />
        <Link href="/signin" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3.5")}>Sign in</Link>
        <Link href="/signup" className={cn(buttonVariants(), "h-9 px-3.5")}>Create account</Link>
      </div>
    </header>
  );
}
