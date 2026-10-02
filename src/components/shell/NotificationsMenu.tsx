"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { markNotificationsReadAction } from "@/app/actions/student";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function NotificationsMenu({ items, unread }: { items: Notification[]; unread: number }) {
  const [, start] = useTransition();
  return (
    <DropdownMenu onOpenChange={(open) => { if (open && unread > 0) start(() => markNotificationsReadAction()); }}>
      <DropdownMenuTrigger aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative grid size-9 shrink-0 place-items-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="size-[1.125rem]" />
        {unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-[#2f5bd3] px-1 text-[0.625rem] font-semibold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)]">
        {/* The menu library requires a label to live inside a group, or it throws when opened. */}
        <DropdownMenuGroup><DropdownMenuLabel className="text-sm font-semibold text-foreground">Notifications</DropdownMenuLabel></DropdownMenuGroup>
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nothing yet. You&apos;ll hear about applications and changes here.</p>
        ) : items.map((n) => (
          <DropdownMenuItem key={n.id} render={n.link ? <Link href={n.link} /> : undefined} className="flex flex-col items-start gap-0.5 py-2">
            <span className="flex w-full items-center gap-2 text-sm font-medium">
              {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-[#2f5bd3]" />}
              <span className="flex-1">{n.title}</span>
            </span>
            {n.body && <span className="text-[0.8125rem] text-muted-foreground">{n.body}</span>}
            <span className={cn("text-xs", n.read ? "text-zinc-400" : "text-zinc-500")}>{when(n.createdAt)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
