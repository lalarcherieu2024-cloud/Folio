import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/shared/ChatPanel";
import { InterviewCard } from "@/components/student/InterviewCard";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/lib/data/messages";
import { getApplicationDetail } from "@/lib/data/student";
import { cn } from "@/lib/utils";
import { TONE_CLASS, eur, firstName, statusInfo, weeksLabel } from "@/lib/work";

export const metadata = { title: "Application · Folio" };

// One application: where it stands, the interview if there is one, and messages with the company once hired.
export default async function ApplicationPage(props: PageProps<"/applications/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/applications/${id}`, "student");
  const a = await getApplicationDetail(user, id);
  if (!a) notFound();
  const p = a.project;
  const s = statusInfo(a, p);
  const client = p.orgName ?? firstName(p.clientName);
  const hired = a.status === "accepted" || a.status === "delivered";
  const canMessage = hired && p.clientKind === "company";
  const messages = canMessage ? await getMessages(user, a.id) : [];

  return (
    <div className="page-enter flex max-w-[53.75rem] flex-col gap-6">
      <Link href="/applications" className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />My work</Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.875rem] font-semibold leading-tight tracking-[-0.025em]">{p.title}</h1>
          <span className={cn("inline-flex h-[1.375rem] items-center rounded-md px-2 text-xs font-medium", TONE_CLASS[s.tone])}>{s.label}</span>
          <Link href={`/projects/${p.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto h-8 bg-white px-3 text-[0.8125rem]")}>View brief</Link>
        </div>
        <p className="text-[0.9375rem] text-muted-foreground">{client} · <span className="font-mono">{eur(p.priceEur)}</span> · {weeksLabel(p.weeks)}</p>
      </div>

      {a.status === "interview" && a.interview && <InterviewCard applicationId={a.id} interview={a.interview} client={client} />}

      {canMessage ? (
        <ChatPanel applicationId={a.id} messages={messages} otherName={client} intro={`Ask ${client} anything about the project. They'll share extra details here.`} />
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-panel px-4 py-3 text-[0.8125rem] text-zinc-600">
          {a.status === "declined" ? "This project went with another student."
            : hired ? "Messages are available on company projects."
            : `Once ${client} accepts you, you'll be able to message them here.`}
        </p>
      )}
    </div>
  );
}
