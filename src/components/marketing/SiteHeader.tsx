"use client";

import { Building2, ChevronDown, LogOut, Menu, RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

// The front page's sections, in page order. On the front page a tab scrolls there smoothly and shows which section
// you're in; from any other page it opens the front page at that section. Every section has the same scroll margin
// (scroll-mt-24), so each one lands just below this header.
const NAV = [["how", "How it works"], ["hiring", "For companies"], ["getting-paid", "Getting paid"], ["students", "For students"], ["trust", "Questions"]] as const;

/** On the front page: the section under a line a little above the middle of the screen. Measured on every scroll and
 *  resize (once per frame), so it's always right, also for sections without a tab (then nothing is highlighted). */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.45;
      const at = [...document.querySelectorAll<HTMLElement>("main section[id]")].find((s) => { const r = s.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
      setActive(at?.id ?? null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [enabled]);
  return enabled ? active : null;
}

/** Scroll to a front-page section, or false when it isn't on this page (then the link navigates there instead). */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
  return true;
}

// Header for signed-out visitors. Hidden on the company pages and student sign-up, which have their own full-screen layout.
// `onboarding`: a student who is signed in but hasn't finished signing up.
export function SiteHeader({ onboarding }: { onboarding?: { name: string; email: string } }) {
  const path = usePathname();
  const home = path === "/";
  const active = useActiveSection(home);
  if (path.startsWith("/company/") || path === "/signup" || path.startsWith("/welcome")) return null;
  const tab = (id: string, label: string) => (
    <Link key={id} href={`/#${id}`} aria-current={active === id ? "location" : undefined}
      onClick={(e) => { if (home && scrollToSection(id)) e.preventDefault(); }}
      className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3", active === id ? "bg-panel text-foreground" : "text-zinc-600")}>
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[75rem] items-center gap-2 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Folio home">
          <Logo size={64} className="size-11 md:size-16" />
          <span className="text-xl font-semibold tracking-tight md:text-2xl">Folio</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-0.5 text-sm lg:flex" aria-label="Main">
          {NAV.map(([id, label]) => tab(id, label))}
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
          <Link href="/signin" className={cn(buttonVariants({ variant: "ghost" }), "hidden h-9 px-3.5 sm:inline-flex")}>Sign in</Link>
          <Link href="/signup" className={cn(buttonVariants(), "h-9 px-3.5")}>Create account</Link>
        </>}
        {/* Below the width where the tabs fit: the same sections (and sign in) in a menu. */}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Menu" className="grid size-9 shrink-0 place-items-center rounded-md text-zinc-700 outline-none hover:bg-panel focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              {NAV.map(([id, label]) => home
                ? <DropdownMenuItem key={id} onClick={() => scrollToSection(id)}>{label}</DropdownMenuItem>
                : <DropdownMenuItem key={id} render={<Link href={`/#${id}`} />}>{label}</DropdownMenuItem>)}
            </DropdownMenuGroup>
            {!onboarding && <>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/signin" />}>Sign in</DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
