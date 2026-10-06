import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { ConversationList } from "@/components/student/ConversationList";
import { PageHeader } from "@/components/startup/ui";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getConversations, getMessages, markConversationRead } from "@/lib/data/messages";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/work";

export const metadata = { title: "Messages · Folio" };

// STARTUP INTERFACE. Every conversation with the students you hired, in one place: the same inbox students have.
// The list sits on the left and the open conversation on the right (on a phone: the list, then the conversation).
export default async function CompanyMessages({ searchParams }: PageProps<"/company/messages">) {
  const user = await requireUser("/company/messages", "company");
  const { c } = await searchParams;
  const conversations = await getConversations(user);
  const picked = typeof c === "string" ? conversations.find((x) => x.applicationId === c) : undefined;
  const open = picked ?? conversations[0];
  const [messages] = open ? await Promise.all([getMessages(user, open.applicationId), markConversationRead(user, open.applicationId)]) : [[]];

  return (
    <div className="page-enter flex flex-col gap-6">
      <PageHeader title="Messages" sub="Talk to the students working on your projects. A conversation opens once you accept someone." />

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-panel px-6 py-12 text-center">
          <span className="empty-icon grid size-12 place-items-center rounded-full bg-soft text-brand"><MessageSquare className="size-5" /></span>
          <p className="max-w-[44ch] text-sm text-muted-foreground">No conversations yet. When you accept a student on one of your projects, you can message them here.</p>
          <Link href="/company/applicants" className={cn(buttonVariants({ variant: "outline" }), "h-9 bg-white px-3.5")}>See applicants</Link>
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-[20rem_1fr]">
          <div className={cn("overflow-hidden rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]", picked && "hidden md:block")}>
            <ConversationList items={conversations} selectedId={open?.applicationId} hrefFor={(x) => `/company/messages?c=${x.applicationId}`} />
          </div>
          {open && (
            <div className={cn("flex min-w-0 flex-col gap-3", !picked && "hidden md:flex")}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]">
                {picked && <Link href="/company/messages" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground md:hidden"><ArrowLeft className="size-3.5" />All conversations</Link>}
                <span className="text-muted-foreground">{open.projectTitle}</span>
                <Link href={`/company/applicants/${open.applicationId}`} className="ml-auto font-medium text-foreground underline underline-offset-4">Open applicant</Link>
              </div>
              <ChatPanel
                applicationId={open.applicationId} userId={user.id} readOnly={open.closed} messages={messages} otherName={firstName(open.otherName)}
                intro="Share extra information, links or files they'll need, and answer their questions here."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
