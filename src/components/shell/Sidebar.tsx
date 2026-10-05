"use client";

import { Building2, ChevronsUpDown, ListChecks, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { signOutAction } from "@/app/actions/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Role, StudentProfile } from "@/lib/types";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { navFor, type NavCounts } from "./nav";
import { Logo } from "@/components/shared/Logo";

export function NavItems({ role, counts, onNavigate, collapsed = false }: { role: Role; counts: NavCounts; onNavigate?: () => void; collapsed?: boolean }) {
  const path = usePathname();
  const items = navFor(role, path, counts);
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Main">
      {collapsed ? <div className="mx-2 mb-2 mt-1 h-px bg-border" /> : <div className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Workspace</div>}
      {items.map(({ href, label, icon: Icon, count, active }) => (
        <Link
          key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined}
          className={cn("relative flex h-[2.125rem] items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors", collapsed && "h-12 justify-center rounded-xl px-0", active ? "bg-soft font-medium text-primary" : "text-zinc-600 hover:bg-[#eef4f8] hover:text-foreground")}
        >
          <Icon className={cn("shrink-0", collapsed ? "size-[1.375rem]" : "size-4")} />
          <span className={cn("flex-1", collapsed && "sr-only")}>{label}</span>
          {count !== undefined && !collapsed && <span className="font-mono text-xs text-muted-foreground">{count}</span>}
          {count !== undefined && count > 0 && collapsed && <span aria-hidden className="absolute right-3 top-3 size-2 rounded-full bg-primary" />}
        </Link>
      ))}
    </nav>
  );
}

export function UserMenu({ user, side = "top", collapsed = false }: { user: StudentProfile; side?: "top" | "bottom" | "right"; collapsed?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger title={collapsed ? user.fullName : undefined} className={cn("flex w-full items-center gap-2.5 rounded-md p-2 text-left outline-none hover:bg-[#eef4f8] focus-visible:ring-2 focus-visible:ring-ring", collapsed && "justify-center p-1.5")}>
        <UserAvatar name={user.fullName} color={user.avatarColor} url={user.avatarUrl} className={cn("rounded-lg text-xs", collapsed ? "size-11 rounded-xl text-sm" : "size-8")} />
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{user.fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : side} align={collapsed ? "end" : "start"} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col leading-snug">
            <span className="text-sm font-medium text-foreground">{user.fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.role === "student" && <><DropdownMenuItem render={<Link href="/profile" />}><User className="size-4" />Profile &amp; record</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/applications" />}><ListChecks className="size-4" />My work</DropdownMenuItem>
        <DropdownMenuSeparator /></>}
        {user.role === "company" && <><DropdownMenuItem render={<Link href="/company/profile" />}><Building2 className="size-4" />Company profile</DropdownMenuItem>
        <DropdownMenuSeparator /></>}
        <DropdownMenuItem variant="destructive" onClick={() => { toast("Signed out"); void signOutAction(); }}><LogOut className="size-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({ user, counts, collapsed = false }: { user: StudentProfile; counts: NavCounts; collapsed?: boolean }) {
  return (
    <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r bg-panel transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] md:flex", collapsed ? "w-[5.5rem]" : "w-60")}>
      <div className={cn("flex h-20 items-center gap-3 border-b", collapsed ? "justify-center px-0" : "px-3.5")}>
        <Logo size={collapsed ? 56 : 64} />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-semibold tracking-tight">Folio</span>
            <span className="text-xs text-muted-foreground">{user.role === "company" ? "For companies" : "IE Madrid"}</span>
          </div>
        )}
      </div>
      <NavItems role={user.role} counts={counts} collapsed={collapsed} />
      <div className="border-t p-2"><UserMenu user={user} collapsed={collapsed} /></div>
    </aside>
  );
}
