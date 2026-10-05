"use client";

import { MessageSquare, Paperclip, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendMessageAction, sendMessageWithFilesAction } from "@/app/actions/messages";
import { FileRow } from "@/components/shared/FilePreview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/lib/data/messages";
import { fmtKb, safeName } from "@/lib/files";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// New messages arrive instantly through Supabase Realtime (migration 0018). The slow poll is only a
// safety net in case the live connection drops.
const FALLBACK_REFRESH_MS = 15000;

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

const MAX_FILES = 5;
const MAX_MB = 25;

/** A simple conversation: history, and a box to write in. Enter sends, Shift+Enter adds a line. Files can be attached. */
export function ChatPanel({ applicationId, userId, messages, otherName, intro, readOnly = false }: { applicationId: string; userId: string; messages: Message[]; otherName: string; intro: string; readOnly?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const picker = useRef<HTMLInputElement>(null);
  const canSend = (text.trim().length > 0 || files.length > 0) && !pending;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const big = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (big) { toast.error(`${big.name} is over ${MAX_MB} MB.`); return; }
    if (files.length + picked.length > MAX_FILES) toast.error(`Up to ${MAX_FILES} files per message.`);
    setFiles([...files, ...picked].slice(0, MAX_FILES));
  }

  // Text-only messages go through the original path; with files, they are uploaded first, then recorded together.
  // The box is cleared only once the message went through, so nothing is lost on an error.
  function send() {
    if (!canSend) return;
    start(async () => {
      setError(null);
      if (files.length === 0) {
        const f = new FormData();
        f.set("body", text);
        const r = await sendMessageAction(applicationId, {}, f);
        if (r.error) setError(r.error); else setText("");
        return;
      }
      const supabase = createClient();
      const uploaded: { path: string; name: string; sizeKb: number }[] = [];
      for (const [i, file] of files.entries()) {
        const path = `${userId}/${applicationId}/${Date.now()}-${i}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("chat-files").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) {
          if (uploaded.length) await supabase.storage.from("chat-files").remove(uploaded.map((u) => u.path));
          setError(/bucket not found/i.test(upErr.message) ? "Sending files needs migration 0020. Run it in the Supabase SQL Editor." : `Couldn't upload ${file.name}.`);
          return;
        }
        uploaded.push({ path, name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) });
      }
      const r = await sendMessageWithFilesAction(applicationId, text, uploaded);
      if (r.error) {
        await supabase.storage.from("chat-files").remove(uploaded.map((u) => u.path));
        setError(r.error);
        return;
      }
      setText(""); setFiles([]);
    });
  }
  const form = useRef<HTMLFormElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [messages.length]);

  // Live updates: re-render as soon as either person sends a message in this conversation.
  // The database only lets the two participants see these rows, so the subscription carries their session.
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      channel = supabase.channel(`messages:${applicationId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${applicationId}` }, () => router.refresh())
        .subscribe();
    })();
    return () => { cancelled = true; if (channel) void supabase.removeChannel(channel); };
  }, [applicationId, router]);

  // Catch up straight away when you come back to the tab, and every so often as a fallback.
  useEffect(() => {
    const refreshIfVisible = () => { if (document.visibilityState === "visible") router.refresh(); };
    const id = setInterval(refreshIfVisible, FALLBACK_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [router]);

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <MessageSquare className="size-4 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">Messages with {otherName}</span>
          <span className="text-[0.8125rem] text-muted-foreground">{readOnly ? "This project is complete. You can read the conversation, but not send new messages." : intro}</span>
        </div>
      </div>

      <div ref={list} className="flex max-h-[28rem] min-h-[10rem] flex-col gap-3 overflow-y-auto bg-panel px-5 py-4">
        {messages.length === 0 && <p className="m-auto max-w-[36ch] text-center text-sm text-muted-foreground">{readOnly ? "No messages were sent on this project." : "No messages yet. Say hello, share links or files you'll need, or ask a question."}</p>}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", m.mine ? "items-end self-end" : "items-start self-start")}>
            <span className="text-xs text-muted-foreground">{m.mine ? "You" : m.senderName} · {when(m.createdAt)}</span>
            {m.body && <p className={cn("whitespace-pre-wrap break-words rounded-xl px-3.5 py-2.5 text-sm", m.mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-white")}>{m.body}</p>}
            {m.files.length > 0 && (
              <ul className="flex w-[min(24rem,100%)] flex-col gap-1.5 text-left">
                {m.files.map((f) => <FileRow key={f.id} kind="chat" id={f.id} name={f.fileName} sizeKb={f.sizeKb} allowDownload />)}
              </ul>
            )}
          </div>
        ))}
      </div>

      {readOnly ? (
        <div className="border-t bg-white px-5 py-3 text-[0.8125rem] text-muted-foreground">Conversation closed · history only</div>
      ) : (
      <form ref={form} onSubmit={(e) => { e.preventDefault(); send(); }} className="flex flex-col gap-2 border-t p-4">
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex max-w-full items-center gap-2 rounded-md border bg-panel px-2.5 py-1.5 text-[0.8125rem]">
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" /><span className="min-w-0 truncate">{f.name}</span><span className="shrink-0 text-xs text-muted-foreground">{fmtKb(Math.max(1, Math.round(f.size / 1024)))}</span>
                <button type="button" disabled={pending} aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><X className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2">
          <input ref={picker} type="file" multiple className="sr-only" onChange={pick} />
          <Button type="button" variant="outline" disabled={pending || files.length >= MAX_FILES} onClick={() => picker.current?.click()} aria-label="Attach files" title={`Attach files (up to ${MAX_FILES}, ${MAX_MB} MB each)`} className="h-[2.75rem] bg-white px-3"><Paperclip className="size-4" /></Button>
          <Textarea
            name="body" value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} rows={2} aria-label="Write a message"
            placeholder={`Write to ${otherName}…`} className="max-h-40 min-h-[2.75rem] resize-none bg-white"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          />
          <Button type="submit" disabled={!canSend} className="h-[2.75rem] gap-1.5 px-3.5"><Send className="size-4" />{pending ? (files.length ? "Uploading" : "Sending") : "Send"}</Button>
        </div>
        {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      </form>
      )}
    </section>
  );
}
