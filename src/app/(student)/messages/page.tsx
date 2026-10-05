import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { ConversationList } from "@/components/student/ConversationList";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getConversations, getMessages, markConversationRead } from "@/lib/data/messages";
import { cn } from "@/lib/utils";

export const metadata = { title: "Messages · Folio" };

// Every conversation with the companies that hired you, in one place. The list sits on the left,
// the open conversation on the right (on a phone: the list first, then the conversation on its own).
export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const user = await requireUser("/messages", "student");
  const { c } = await searchParams;
  const conversations = await getConversations(user);
  const picked = typeof c === "string" ? conversations.find((x) => x.applicationId === c) : undefined;
  const open = picked ?? conversations[0];
  const [messages] = open ? await Promise.all([getMessages(user, open.applicationId), markConversationRead(user, open.applicationId)]) : [[]];

  return (
    <div className="page-enter flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Messages</h1>
        <p className="text-[0.9375rem] text-muted-foreground">Talk to the companies you&apos;re working with. A conversation opens once a company accepts you.</p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-panel px-6 py-12 text-center">
          <span className="empty-icon grid size-12 place-items-center rounded-full bg-soft text-brand"><MessageSquare className="size-5" /></span>
          <p className="max-w-[44ch] text-sm text-muted-foreground">No conversations yet. When a company accepts you on one of their projects, you can message them here.</p>
          <Link href="/projects" className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3.5")}>Find a project</Link>
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-[20rem_1fr]">
          <div className={cn("overflow-hidden rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]", picked && "hidden md:block")}>
            <ConversationList items={conversations} selectedId={open?.applicationId} hrefFor={(x) => `/messages?c=${x.applicationId}`} />
          </div>
          {open && (
            <div className={cn("flex min-w-0 flex-col gap-3", !picked && "hidden md:flex")}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]">
                {picked && <Link href="/messages" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground md:hidden"><ArrowLeft className="size-3.5" />All conversations</Link>}
                <span className="text-muted-foreground">{open.projectTitle}</span>
                <Link href={`/applications/${open.applicationId}`} className="ml-auto font-medium text-foreground underline underline-offset-4">Open project</Link>
              </div>
              <ChatPanel
                applicationId={open.applicationId} userId={user.id} readOnly={open.closed} messages={messages} otherName={open.otherName}
                intro={`Ask ${open.otherName} anything about the project. They'll share extra details here.`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
