import { Check, Star } from "lucide-react";
import type { Credential } from "@/lib/types";

export function CredentialCard({ c, className = "" }: { c: Credential; className?: string }) {
  return (
    <article aria-label="Verified project credential" className={`overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)] ${className}`}>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <span>{c.orgName ?? "Student project"} · {c.hood}, Madrid</span>
          <span className="font-mono text-xs">{c.issuedAt}</span>
        </div>
        <h3 className="text-lg font-semibold leading-snug tracking-tight">{c.projectTitle}</h3>
        <p className="text-sm italic leading-relaxed text-zinc-600">“{c.review}”</p>
      </div>
      <div className="flex items-center justify-between border-t bg-panel px-5 py-3 text-[13px]">
        <span className="flex items-center gap-1.5 font-medium text-[#16a34a]"><Check className="size-3.5" strokeWidth={3} />Verified by {c.clientName}</span>
        <span className="flex gap-0.5" aria-label={`${c.rating} out of 5`}>
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3.5 ${i < c.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-zinc-300"}`} />)}
        </span>
      </div>
    </article>
  );
}
