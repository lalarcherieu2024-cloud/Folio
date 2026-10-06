"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Notification, StudentProfile } from "@/lib/types";
import { NotificationsMenu } from "./NotificationsMenu";
import { Logo } from "@/components/shared/Logo";
import { NavItems, UserMenu } from "@/components/shell/Sidebar";
import type { NavCounts } from "./nav";


export function Topbar({ user, counts, notifications, sidebarCollapsed, onToggleSidebar }: { user: StudentProfile; counts: NavCounts; notifications: { items: Notification[]; unread: number }; sidebarCollapsed: boolean; onToggleSidebar: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  // Press "/" anywhere (outside a text field) to jump to the search bar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const company = user.role === "company";

  return (
    <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur md:px-6">
      <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-md hover:bg-muted md:hidden"><Menu className="size-5" /></button>
      <button type="button" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={`${sidebarCollapsed ? "Expand" : "Collapse"} sidebar (Ctrl/⌘ B)`} className="hidden size-11 place-items-center rounded-lg text-zinc-600 hover:bg-white/70 hover:text-foreground md:grid">
        {sidebarCollapsed ? <PanelLeftOpen className="size-[1.375rem]" /> : <PanelLeftClose className="size-[1.375rem]" />}
      </button>
      {company ? (
        <div className="flex-1" />
      ) : (
        <form
          role="search" className="group relative mx-auto hidden w-full max-w-[42rem] flex-1 sm:block"
          onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); router.push(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects"); }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            ref={searchRef} name="q" aria-label="Search projects" autoComplete="off" placeholder="Search projects, skills, companies…"
            className="h-11 w-full rounded-full border bg-white pl-11 pr-14 text-[0.9375rem] shadow-xs outline-none transition-[box-shadow,border-color] duration-200 placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_4px_rgba(12,74,110,.10)]"
          />
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border bg-panel px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground group-focus-within:opacity-0 md:block" aria-hidden>/</kbd>
        </form>
      )}
      <NotificationsMenu items={notifications.items} unread={notifications.unread} />
      {company && <Link href="/company/projects/new" className={cn(buttonVariants(), "h-9 shrink-0 px-3.5")}><Plus className="size-4" />Post a project</Link>}
      <UserMenu user={user} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 gap-0 p-0 sm:max-w-64" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-20 items-center gap-3 border-b px-3.5"><Logo size={56} /><span className="text-xl font-semibold">Folio</span></div>
          <NavItems role={user.role} counts={counts} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
