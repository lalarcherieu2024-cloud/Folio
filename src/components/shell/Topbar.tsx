"use client";

import { Menu, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { StudentProfile } from "@/lib/types";
import { Logo } from "@/components/shared/Logo";
import { NavItems, UserMenu } from "@/components/shell/Sidebar";
import { PAGE_TITLES, type NavCounts } from "./nav";


export function Topbar({ user, counts }: { user: StudentProfile; counts: NavCounts }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const title = PAGE_TITLES.find(([p]) => path.startsWith(p))?.[1] ?? "Folio";
  const company = user.role === "company";

  return (
    <header className={cn("sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6", company ? "bg-cream/90" : "bg-white/90")}>
      <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-md hover:bg-muted md:hidden"><Menu className="size-5" /></button>
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
        <span className="hidden sm:inline">Folio</span><span className="hidden text-zinc-300 sm:inline">/</span>
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <div className="flex-1" />
      <form
        role="search" className={cn("relative hidden w-[min(320px,40vw)]", !company && "sm:block")}
        onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); router.push(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects"); }}
      >
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <input name="q" aria-label="Search projects" placeholder="Search projects, skills, companies…" className="h-9 w-full rounded-md border bg-white pl-8.5 pr-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </form>
      <Link href={company ? "/company/projects/new" : "/projects/new"} className={cn(buttonVariants(), "h-9 shrink-0 px-3.5", company && "bg-brand text-white hover:bg-brand/90")}><Plus className="size-4" />{company ? "Post a project" : "Request help"}</Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 gap-0 p-0 sm:max-w-64" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-16 items-center gap-2.5 border-b px-3"><Logo size={40} /><span className="text-base font-semibold">Folio</span></div>
          <NavItems role={user.role} counts={counts} onNavigate={() => setOpen(false)} />
          <div className="border-t p-2"><UserMenu user={user} /></div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
