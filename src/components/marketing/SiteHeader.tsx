"use client";

import { Building2, ChevronDown, LogOut, RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

// Jump links into the "How Folio works" section on the front page.
const NAV = [["/#hiring", "Hiring"], ["/#getting-paid", "Getting paid"], ["/#trust", "Questions"]] as const;

// Header for signed-out visitors. Hidden on the company pages and student sign-up, which have their own full-screen layout.
// `onboarding`: a student who is signed in but hasn't finished signing up.
export function SiteHeader({ onboarding }: { onboarding?: { name: string; email: string } }) {
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
        {onboarding ? <>
          {/* Signed in but sign-up isn't finished. Say so in words (who you are, that it's unfinished), so it doesn't look
              like a normal signed-in account; the name opens every way out (start over, switch, sign out). */}
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Account" className="group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 outline-none hover:bg-panel focus-visible:ring-2 focus-visible:ring-ring sm:pr-3">
              <span className="relative">
                <UserAvatar name={onboarding.name} className="size-9 rounded-full text-xs" />
                <span aria-hidden className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-[#f59e0b] ring-2 ring-white" />
              </span>
              <span className="hidden flex-col text-left leading-tight sm:flex">
                <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">{onboarding.name}</span>
                <span className="text-xs text-[#b45309]">Sign-up not finished</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[popup-open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col leading-snug">
                  <span className="text-sm font-medium text-foreground">{onboarding.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">Signed in as {onboarding.email}</span>
                  <span className="mt-1.5 text-xs font-normal text-muted-foreground">Finish your profile to start using Folio.</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* Both open the "continue, or start from scratch?" prompt (UnfinishedSignupScreen). */}
              <DropdownMenuItem render={<Link href="/signup" />}><RotateCcw className="size-4" />Start from scratch</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/company/signup" />}><Building2 className="size-4" />Sign up as a company instead</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => void signOutAction()}><LogOut className="size-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/welcome" className={cn(buttonVariants(), "ml-1 h-9 px-3.5")}>Finish sign-up</Link>
        </> : <>
          <Link href="/signin" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3.5")}>Sign in</Link>
          <Link href="/signup" className={cn(buttonVariants(), "h-9 px-3.5")}>Create account</Link>
        </>}
      </div>
    </header>
  );
}
