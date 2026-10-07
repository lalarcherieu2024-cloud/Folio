"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveCompanyAction, requestChangesAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Approve a company, or ask it for a change with a note it will see. */
export function ReviewActions({ orgId, name }: { orgId: string; name: string }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [busy, start] = useTransition();
  const approve = () => start(async () => {
    const r = await approveCompanyAction(orgId);
    if (r.error) toast.error(r.error); else toast.success(`${name || "Company"} is verified`, { description: "They can publish projects now, and they've been told." });
  });
  const ask = () => start(async () => {
    const r = await requestChangesAction(orgId, note);
    if (r.error) toast.error(r.error); else toast(`Sent to ${name || "the company"}`, { description: "They'll see your note and can fix and resubmit." });
  });
  if (asking) return (
    <div className="flex w-full flex-col gap-2">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus placeholder="What needs changing? e.g. The CIF doesn't match the company name on the registry." className="resize-y bg-white text-sm" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setAsking(false)} disabled={busy} className="h-9 px-3">Cancel</Button>
        <Button type="button" onClick={ask} disabled={busy} className="h-9 px-3.5">{busy ? "Sending…" : "Send to the company"}</Button>
      </div>
    </div>
  );
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => setAsking(true)} disabled={busy} className="h-9 bg-white px-3.5">Request changes</Button>
      <Button type="button" onClick={approve} disabled={busy} className="h-9 gap-1.5 bg-[#16a34a] px-3.5 text-white hover:bg-[#15803d]"><Check className="size-4" strokeWidth={2.5} />{busy ? "Saving…" : "Approve"}</Button>
    </div>
  );
}
