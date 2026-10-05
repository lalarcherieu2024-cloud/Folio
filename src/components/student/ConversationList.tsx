import { Paperclip } from "lucide-react";
import Link from "next/link";
import type { Conversation } from "@/lib/data/messages";
import { cn } from "@/lib/utils";

// Today shows the time, anything older the date.
function when(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString("en-GB", sameDay ? { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" } : { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
}

/** One row per conversation: who, which project, the last message and whether something new is waiting. */
export function ConversationList({ items, hrefFor, selectedId }: { items: Conversation[]; hrefFor: (c: Conversation) => string; selectedId?: string }) {
  return (
    <ul className="flex flex-col">
      {items.map((c) => {
        const isNew = c.unread > 0 && c.applicationId !== selectedId;
        const preview = !c.last ? "No messages yet. Say hello." : c.last.body || (c.last.hasFiles ? "Sent a file" : "");
        return (
          <li key={c.applicationId} className="border-t border-zinc-100 first:border-t-0">
            <Link
              href={hrefFor(c)} aria-current={c.applicationId === selectedId ? "true" : undefined}
              className={cn("flex items-start gap-3 px-5 py-3.5 hover:bg-panel", c.applicationId === selectedId && "bg-soft hover:bg-soft")}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef4f8] text-sm font-semibold text-zinc-700">{c.otherName.slice(0, 1).toUpperCase()}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className={cn("truncate text-sm", isNew ? "font-semibold" : "font-medium")}>{c.otherName}</span>
                  {c.last && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{when(c.last.createdAt)}</span>}
                </span>
                <span className="truncate text-xs text-muted-foreground">{c.projectTitle}{c.closed ? " · Closed" : ""}</span>
                <span className={cn("flex items-center gap-1.5 text-[0.8125rem]", isNew ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {c.last?.hasFiles && <Paperclip className="size-3 shrink-0" />}
                  <span className="truncate">{c.last?.mine ? "You: " : ""}{preview}</span>
                  {isNew && <span aria-label={`${c.unread} new`} className="ml-auto grid min-w-5 shrink-0 place-items-center rounded-full bg-[#16a34a] px-1.5 text-[0.6875rem] font-semibold leading-5 text-white">{c.unread > 9 ? "9+" : c.unread}</span>}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
