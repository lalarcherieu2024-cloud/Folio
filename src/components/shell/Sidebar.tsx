"use client";

import { Building2, LogOut, User } from "lucide-react";
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
      {items.map(({ href, label, icon: Icon, count, alert, active }) => (
        <Link
          key={href} href={href} onClick={onNavigate} data-tour={href === "/company/applicants" ? "applicants" : undefined} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined}
          className={cn("group/nav relative flex h-[2.125rem] items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors", collapsed && "h-11 justify-center rounded-xl px-0", active ? "bg-soft font-medium text-primary" : "text-zinc-600 hover:bg-[#eef4f8] hover:text-foreground")}
        >
          {/* Each section keeps its colour, muted until it's the current page or hovered, so the list reads calm. */}
          {/* Companies get the same icons in softer colours, for a more formal look (never fully saturated). */}
          <Icon className={cn("shrink-0 transition-[filter,opacity] duration-200", collapsed ? "size-[1.625rem]" : "size-5",
            role === "company"
              ? (active ? "saturate-[.55]" : "opacity-75 saturate-[.2] group-hover/nav:opacity-100 group-hover/nav:saturate-[.55]")
              : !active && "opacity-75 saturate-[.35] group-hover/nav:opacity-100 group-hover/nav:saturate-100")} />
          <span className={cn("flex-1", collapsed && "sr-only")}>{label}</span>
          {count !== undefined && !collapsed && (alert
            ? <span aria-label={`${count} unread`} className="grid min-w-5 place-items-center rounded-full bg-[#16a34a] px-1.5 text-[0.6875rem] font-semibold leading-5 text-white">{count > 9 ? "9+" : count}</span>
            : <span className="font-mono text-xs text-muted-foreground">{count}</span>)}
          {count !== undefined && count > 0 && collapsed && <span aria-hidden className={cn("absolute right-3 top-3 size-2 rounded-full", alert ? "bg-[#16a34a]" : "bg-primary")} />}
        </Link>
      ))}
    </nav>
  );
}

// The account menu: your photo at the top right of every app page (Topbar). The one place for your profile and
// signing out, so the sidebar only holds the page links.
/** What the account menu shows: the company (name and logo) for company accounts, the person for students. */
export type AccountFace = { name: string; url: string | null; color: string | null };

export function UserMenu({ user, account }: { user: StudentProfile; account?: AccountFace }) {
  const company = user.role === "company" && account;
  const face = company ? account : { name: user.fullName, url: user.avatarUrl, color: user.avatarColor };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account" title={face.name} className="shrink-0 rounded-full outline-none ring-offset-2 transition-shadow hover:ring-2 hover:ring-slate-200 focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:ring-2 data-[popup-open]:ring-slate-200">
        <UserAvatar name={face.name} color={face.color} url={face.url} className="size-9 rounded-full text-xs" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col leading-snug">
            <span className="text-sm font-medium text-foreground">{face.name}</span>
            {company && <span className="text-xs font-normal text-zinc-600">{user.fullName}</span>}
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.role === "student" && <><DropdownMenuItem render={<Link href="/profile" />}><User className="size-4" />Profile &amp; record</DropdownMenuItem>
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
    </aside>
  );
}
