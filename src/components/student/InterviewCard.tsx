"use client";

import { CalendarClock, Check, ExternalLink, MapPin } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { confirmInterviewAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import type { Interview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { interviewWhen, isLink, linkHref } from "@/lib/work";

/** The interview a client set up: when, where (link or address), their note, and a Confirm button for the student. */
export function InterviewCard({ applicationId, interview, client, canConfirm = true, className }: {
  applicationId: string; interview: Interview; client: string; canConfirm?: boolean; className?: string;
}) {
  const [pending, start] = useTransition();
  const confirm = () => start(async () => {
    const r = await confirmInterviewAction(applicationId);
    if (r.error) toast.error(r.error); else toast.success("Interview confirmed", { description: `${client} has been told you'll be there.` });
  });
  const link = isLink(interview.where);
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-[#a5f3fc] bg-[#f7fdfe] p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-[#155e75]">Interview with {client}</span>
          <span className="inline-flex items-center gap-1.5 text-sm"><CalendarClock className="size-4 text-[#0891b2]" />{interviewWhen(interview.at)} <span className="text-muted-foreground">(Madrid time)</span></span>
          {link ? (
            <a href={linkHref(interview.where)} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline underline-offset-4"><ExternalLink className="size-4 text-[#0891b2]" />Join the call</a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm"><MapPin className="size-4 text-[#0891b2]" />{interview.where}</span>
          )}
        </div>
        {interview.confirmedAt ? (
          <span className="inline-flex h-[1.375rem] items-center gap-1 rounded-md bg-[#dcfce7] px-2 text-xs font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />You confirmed</span>
        ) : canConfirm && (
          <Button size="sm" disabled={pending} onClick={confirm} className="h-8 px-3 text-[0.8125rem]">{pending ? "Confirming…" : "Confirm I'll be there"}</Button>
        )}
      </div>
      {interview.note && <p className="whitespace-pre-wrap rounded-md bg-white px-3 py-2.5 text-[0.8125rem] text-zinc-700">{interview.note}</p>}
    </div>
  );
}
