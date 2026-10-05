"use client";

import { MessageSquare, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessageAction } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/data/messages";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";

const REFRESH_MS = 8000; // new messages show up within a few seconds while the page is open

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

/** A simple conversation: history, and a box to write in. Enter sends, Shift+Enter adds a line. */
export function ChatPanel({ applicationId, messages, otherName, intro }: { applicationId: string; messages: Message[]; otherName: string; intro: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  // Send, then clear the box once the message went through (kept on error so nothing is lost).
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, f) => {
    const res = await sendMessageAction(applicationId, prev, f);
    if (res.ok) setText("");
    return res;
  }, {});
  const form = useRef<HTMLFormElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [messages.length]);

  // Pick up replies while the page is open.
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <MessageSquare className="size-4 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">Messages with {otherName}</span>
          <span className="text-[0.8125rem] text-muted-foreground">{intro}</span>
        </div>
      </div>

      <div ref={list} className="flex max-h-[28rem] min-h-[10rem] flex-col gap-3 overflow-y-auto bg-panel px-5 py-4">
        {messages.length === 0 && <p className="m-auto max-w-[36ch] text-center text-sm text-muted-foreground">No messages yet. Say hello, share links or files you&apos;ll need, or ask a question.</p>}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", m.mine ? "items-end self-end" : "items-start self-start")}>
            <span className="text-xs text-muted-foreground">{m.mine ? "You" : m.senderName} · {when(m.createdAt)}</span>
            <p className={cn("whitespace-pre-wrap break-words rounded-xl px-3.5 py-2.5 text-sm", m.mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-white")}>{m.body}</p>
          </div>
        ))}
      </div>

      <form ref={form} action={action} className="flex flex-col gap-2 border-t p-4">
        <div className="flex items-end gap-2">
          <Textarea
            name="body" value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} rows={2} aria-label="Write a message"
            placeholder={`Write to ${otherName}…`} className="max-h-40 min-h-[2.75rem] resize-none bg-white"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (text.trim() && !pending) form.current?.requestSubmit(); } }}
          />
          <Button type="submit" disabled={!text.trim() || pending} className="h-[2.75rem] gap-1.5 px-3.5"><Send className="size-4" />{pending ? "Sending" : "Send"}</Button>
        </div>
        {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      </form>
    </section>
  );
}
