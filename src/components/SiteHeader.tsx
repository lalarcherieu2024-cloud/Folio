import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

// Header for signed-out visitors.
export function SiteHeader() {
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
          <span className="flex h-9 cursor-not-allowed items-center gap-2 px-3 text-zinc-400" aria-disabled>For startups <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[11px]">Soon</Badge></span>
        </nav>
        <div className="flex-1" />
        <Link href="/signin" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3.5")}>Sign in</Link>
        <Link href="/signup" className={cn(buttonVariants(), "h-9 px-3.5")}>Create account</Link>
      </div>
    </header>
  );
}
