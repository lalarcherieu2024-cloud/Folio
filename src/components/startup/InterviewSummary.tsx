import { CalendarClock, Check, ExternalLink, MapPin } from "lucide-react";
import type { Interview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { interviewWhen, isLink, linkHref } from "@/lib/work";
import { chip, TONES } from "./ui";

/** The company's view of an interview it set up: when, where, and whether the student confirmed. */
export function InterviewSummary({ interview, name }: { interview: Interview; name: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[#a5f3fc] bg-[#f7fdfe] p-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-[#155e75]">Interview with {name}</span>
        <span className="inline-flex items-center gap-1.5 text-sm"><CalendarClock className="size-4 text-[#0891b2]" />{interviewWhen(interview.at)} <span className="text-muted-foreground">(Madrid time)</span></span>
        {isLink(interview.where)
          ? <a href={linkHref(interview.where)} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium underline underline-offset-4"><ExternalLink className="size-4 text-[#0891b2]" />Join the call</a>
          : <span className="inline-flex items-center gap-1.5 text-sm"><MapPin className="size-4 text-[#0891b2]" />{interview.where}</span>}
        {interview.note && <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-zinc-600">{interview.note}</p>}
      </div>
      {interview.confirmedAt
        ? <span className={cn(chip, TONES.success)}><Check className="size-3" strokeWidth={3} />Confirmed</span>
        : <span className={cn(chip, TONES.warning)}>Waiting for confirmation</span>}
    </div>
  );
}
