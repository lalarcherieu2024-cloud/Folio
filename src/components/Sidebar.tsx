"use client";

import { ChevronsUpDown, House, ListChecks, LogOut, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { signOutAction } from "@/app/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StudentProfile } from "@/lib/types";
import { Logo } from "./Logo";

export const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function NavItems({ counts, onNavigate }: { counts: { open: number; mine: number }; onNavigate?: () => void }) {
  const path = usePathname();
  const items = [
    { href: "/", label: "Home", icon: House, count: undefined as number | undefined, active: path === "/" },
    { href: "/projects", label: "Find projects", icon: Search, count: counts.open, active: path.startsWith("/projects") && !path.startsWith("/projects/new") },
    { href: "/applications", label: "My work", icon: ListChecks, count: counts.mine, active: path.startsWith("/applications") },
    { href: "/projects/new", label: "Request help", icon: Plus, count: undefined, active: path.startsWith("/projects/new") },
    { href: "/profile", label: "Profile & record", icon: User, count: undefined, active: path.startsWith("/profile") },
  ];
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Main">
      <div className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Workspace</div>
      {items.map(({ href, label, icon: Icon, count, active }) => (
        <Link
          key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}
          className={cn("flex h-[34px] items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors", active ? "bg-[#f0f0f1] font-medium text-foreground" : "text-zinc-600 hover:bg-[#f0f0f1] hover:text-foreground")}
        >
          <Icon className="size-4 shrink-0" />
          <span className="flex-1">{label}</span>
          {count !== undefined && <span className="font-mono text-xs text-muted-foreground">{count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function UserMenu({ user, side = "top" }: { user: StudentProfile; side?: "top" | "bottom" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none hover:bg-[#f0f0f1] focus-visible:ring-2 focus-visible:ring-ring">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-200 text-xs font-semibold">{initials(user.fullName)}</span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-medium">{user.fullName}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col leading-snug">
            <span className="text-sm font-medium text-foreground">{user.fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}><User className="size-4" />Profile &amp; record</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/applications" />}><ListChecks className="size-4" />My work</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => { toast("Signed out"); void signOutAction(); }}><LogOut className="size-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({ user, counts }: { user: StudentProfile; counts: { open: number; mine: number } }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-panel md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-3">
        <Logo size={44} />
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">Folio</span>
          <span className="text-xs text-muted-foreground">IE Madrid</span>
        </div>
      </div>
      <NavItems counts={counts} />
      <div className="border-t p-2"><UserMenu user={user} /></div>
    </aside>
  );
}

