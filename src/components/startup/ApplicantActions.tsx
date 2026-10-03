"use client";

import { Star } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { acceptApplicantAction, declineApplicantAction, verifyDeliveryAction } from "@/app/actions/startup";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Applicant } from "@/lib/data/startup";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/work";
import { chip, TONES } from "./ui";

function VerifyDialog({ a, open, onOpenChange }: { a: Pick<Applicant, "id" | "name" | "projectTitle">; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(verifyDeliveryAction, {});
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current || !state.ok) return;
    handled.current = state;
    onOpenChange(false);
    toast.success("Delivery verified", { description: `${firstName(a.name)} now has a verified credential for this project.` });
  }, [state, a.name, onOpenChange]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-[30rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Verify {firstName(a.name)}&apos;s work</DialogTitle>
          <DialogDescription>Check the deliverable for “{a.projectTitle}”. Your rating and review become the student&apos;s verified credential, shown on their profile.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="applicationId" value={a.id} />
          <input type="hidden" name="rating" value={rating} />
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-0.5">
                <Star className={cn("size-7", n <= rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-zinc-300")} />
              </button>
            ))}
          </div>
          <Textarea name="review" value={review} onChange={(e) => setReview(e.target.value.slice(0, 600))} rows={4} aria-label="Review" placeholder="What did they deliver, and how was it to work with them?" className="resize-none" />
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <DialogFooter className="mt-1 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!rating || review.trim().length < 10 || pending}>{pending ? "Verifying…" : "Verify and issue credential"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Accept / Decline for a pending applicant, Verify for delivered work, otherwise the outcome as a badge. */
export function ApplicantActions({ a, size = "sm" }: { a: Applicant; size?: "sm" | "lg" }) {
  const [busy, start] = useTransition();
  const [verifying, setVerifying] = useState(false);
  const h = size === "lg" ? "h-9 px-3.5 text-sm" : "h-8 px-3 text-[0.8125rem]";

  const accept = () => start(async () => {
    const r = await acceptApplicantAction(a.id);
    if (r.error) toast.error(r.error); else toast.success(`${firstName(a.name)} is now working on this`, { description: r.notice });
  });
  const decline = () => start(async () => {
    const r = await declineApplicantAction(a.id);
    if (r.error) toast.error(r.error); else toast.success("Applicant declined");
  });

  if (a.status === "pending") {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={decline} className={cn("bg-white", h)}>Decline</Button>
        <Button size="sm" disabled={busy} onClick={accept} className={h}>Accept</Button>
      </div>
    );
  }
  if (a.status === "delivered" && a.projectStatus !== "verified") {
    return (
      <>
        <Button size="sm" onClick={() => setVerifying(true)} className={h}>Verify delivery</Button>
        <VerifyDialog a={a} open={verifying} onOpenChange={setVerifying} />
      </>
    );
  }
  const [label, tone] = a.status === "declined" ? ["Declined", TONES.muted] : a.projectStatus === "verified" ? ["Verified", TONES.success] : ["Working on it", TONES.success];
  return <span className={cn(chip, tone, size === "lg" && "h-7 text-[0.8125rem]")}>{label}</span>;
}
