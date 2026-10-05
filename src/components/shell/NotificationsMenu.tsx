"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function NotificationsMenu({ items, unread }: { items: Notification[]; unread: number }) {
  const [, start] = useTransition();
  // Seen on this screen already: the badge clears when the menu opens, and each green dot clears when
  // you click that notification or close the menu. The server copy is updated in the background.
  const [badgeCleared, setBadgeCleared] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const markSeen = (ids: string[]) => setSeen((prev) => new Set([...prev, ...ids]));
  const shown = badgeCleared ? 0 : unread;
  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open) {
        setBadgeCleared(true);
        if (unread > 0) start(() => markNotificationsReadAction());
      } else {
        markSeen(items.map((n) => n.id));
      }
    }}>
      <DropdownMenuTrigger aria-label={`Notifications${shown ? `, ${shown} unread` : ""}`} className="relative grid size-9 shrink-0 place-items-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="size-[1.125rem]" />
        {shown > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-[#16a34a] px-1 text-[0.625rem] font-semibold leading-4 text-white">{shown > 9 ? "9+" : shown}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-2rem)]">
        {/* The menu library requires a label to live inside a group, or it throws when opened. */}
        <DropdownMenuGroup><DropdownMenuLabel className="text-sm font-semibold text-foreground">Notifications</DropdownMenuLabel></DropdownMenuGroup>
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nothing yet. You&apos;ll hear about applications and changes here.</p>
        ) : items.map((n) => {
          const isNew = !n.read && !seen.has(n.id);
          return (
          <DropdownMenuItem key={n.id} render={n.link ? <Link href={n.link} /> : undefined} onClick={() => markSeen([n.id])} className="flex flex-col items-start gap-0.5 py-2">
            <span className="flex w-full items-center gap-2 text-sm font-medium">
              {isNew && <span className="size-1.5 shrink-0 rounded-full bg-[#16a34a]" />}
              <span className="flex-1">{n.title}</span>
            </span>
            {n.body && <span className="text-[0.8125rem] text-muted-foreground">{n.body}</span>}
            <span className={cn("text-xs", isNew ? "text-zinc-500" : "text-zinc-400")}>{when(n.createdAt)}</span>
          </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
