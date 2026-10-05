import { Check, MessageSquareWarning } from "lucide-react";
import { FileList } from "@/components/shared/FilePreview";
import type { Submission } from "@/lib/data/submissions";
import { cn } from "@/lib/utils";

const STATUS = {
  submitted: ["Waiting for review", "bg-[#ede9fe] text-[#5b21b6]"],
  changes_requested: ["Changes requested", "bg-[#fef3c7] text-[#92400e]"],
  accepted: ["Approved", "bg-[#dcfce7] text-[#166534]"],
} as const;

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Every round of submitted work with the client's feedback, newest first. Same view for student and company. */
export function SubmissionHistory({ submissions, title = "Submitted work" }: { submissions: Submission[]; title?: string }) {
  if (submissions.length === 0) return null;
  const rounds = [...submissions].reverse();
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {rounds.map((s) => {
        const [label, tone] = STATUS[s.status];
        return (
          <div key={s.id} className="flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Submission {s.round}</span>
              <span className={cn("inline-flex h-[1.375rem] items-center gap-1 rounded-md px-2 text-xs font-medium", tone)}>{s.status === "accepted" && <Check className="size-3" strokeWidth={3} />}{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{when(s.submittedAt)}</span>
            </div>
            {s.note && <p className="whitespace-pre-wrap rounded-lg bg-panel px-3.5 py-2.5 text-sm text-zinc-700">{s.note}</p>}
            <FileList kind="submission" files={s.files} allowDownload />
            {s.feedback && (
              <div className="flex gap-2.5 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 text-sm text-[#92400e]">
                <MessageSquareWarning className="mt-0.5 size-4 shrink-0" />
                <div><b className="font-semibold">Feedback</b><p className="mt-0.5 whitespace-pre-wrap">{s.feedback}</p></div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
