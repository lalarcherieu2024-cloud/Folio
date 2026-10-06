"use client";

import { CalendarClock, Star } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { requestChangesAction } from "@/app/actions/submissions";
import { acceptApplicantAction, declineApplicantAction, inviteToInterviewAction, verifyDeliveryAction } from "@/app/actions/startup";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Applicant } from "@/lib/data/startup";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { firstName } from "@/lib/work";
import { chip, TONES } from "./ui";

function VerifyDialog({ a, open, onOpenChange }: { a: Pick<Applicant, "id" | "name" | "projectTitle">; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
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
          <input type="hidden" name="signature" value={signature ?? ""} />
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-0.5">
                <Star className={cn("size-7", n <= rating ? "fill-[#f59e0b] text-[#f59e0b]" : "text-zinc-300")} />
              </button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Textarea name="review" value={review} onChange={(e) => setReview(e.target.value.slice(0, 600))} rows={4} aria-label="Review" placeholder="What did they deliver, and how was it to work with them?" className="resize-none" />
            <span className={cn("text-xs", review.trim().length >= 10 ? "text-muted-foreground" : "text-[#92400e]")}>
              {review.trim().length >= 10 ? "Looks good." : `Write at least 10 characters (${review.trim().length}/10).`}
            </span>
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Sign the certificate</span>
            <SignaturePad onChange={setSignature} disabled={pending} />
            <span className="text-xs text-muted-foreground">Your signature appears on {firstName(a.name)}&apos;s certificate. They sign it next.</span>
          </div>
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <DialogFooter className="mt-1 items-center sm:justify-end">
            {/* Say what's still missing, so a greyed-out button never looks broken. */}
            {(!rating || review.trim().length < 10 || !signature) && (
              <span className="mr-auto text-xs text-muted-foreground">
                Still needed: {[!rating && "a star rating", review.trim().length < 10 && "a longer review", !signature && "your signature"].filter(Boolean).join(", ")}
              </span>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!rating || review.trim().length < 10 || !signature || pending}>{pending ? "Verifying…" : "Sign and issue credential"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangesDialog({ a, open, onOpenChange }: { a: Pick<Applicant, "id" | "name" | "projectTitle">; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [feedback, setFeedback] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(requestChangesAction, {});
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current || !state.ok) return;
    handled.current = state;
    onOpenChange(false);
    setFeedback("");
    toast.success("Feedback sent", { description: `${firstName(a.name)} can update the work and resubmit it.` });
  }, [state, a.name, onOpenChange]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-[30rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Ask {firstName(a.name)} for changes</DialogTitle>
          <DialogDescription>Say what needs to change in “{a.projectTitle}”. The submission goes back to {firstName(a.name)} with your feedback, and they can send it again.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="applicationId" value={a.id} />
          <Textarea name="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value.slice(0, 1500))} rows={5} aria-label="Feedback" placeholder="Be specific: what is missing or wrong, and what you'd like to see instead." className="resize-none" />
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <DialogFooter className="mt-1 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={feedback.trim().length < 10 || pending}>{pending ? "Sending…" : "Send back to student"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// "2026-10-09" and "17:00" in the company's own timezone, for pre-filling a reschedule.
const localParts = (iso: string) => {
  const d = new Date(iso), pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

function InterviewDialog({ a, open, onOpenChange }: { a: Applicant; open: boolean; onOpenChange: (o: boolean) => void }) {
  const prev = a.interview ? localParts(a.interview.at) : null;
  const [date, setDate] = useState(prev?.date ?? "");
  const [time, setTime] = useState(prev?.time ?? "");
  const [place, setPlace] = useState(a.interview?.where ?? "");
  const [note, setNote] = useState(a.interview?.note ?? "");
  const [state, action, pending] = useActionState<FormState, FormData>(inviteToInterviewAction, {});
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current || !state.ok) return;
    handled.current = state;
    onOpenChange(false);
    toast.success(a.interview ? "Interview rescheduled" : "Interview invitation sent", { description: `${firstName(a.name)} gets a notification and can confirm.` });
  }, [state, a.name, a.interview, onOpenChange]);
  // Built in the browser, so the time is the company's local time.
  const at = date && time ? new Date(`${date}T${time}`).toISOString() : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-[30rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{a.interview ? "Reschedule the interview" : `Invite ${firstName(a.name)} to an interview`}</DialogTitle>
          <DialogDescription>Pick a time and add a video-call link or an address. {firstName(a.name)} is notified and can confirm. You can accept or decline after you&apos;ve met.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="applicationId" value={a.id} />
          <input type="hidden" name="at" value={at} />
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="i-date">Date</Label><Input id="i-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" required /></div>
            <div className="grid gap-1.5"><Label htmlFor="i-time">Time</Label><Input id="i-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9" required /></div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="i-place">Meeting link or address</Label>
            <Input id="i-place" name="place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="https://meet.google.com/… or Calle Mayor 1, Madrid" className="h-9" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="i-note">Note (optional)</Label>
            <Textarea id="i-note" name="note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 600))} rows={3} placeholder="20 minutes. Bring two pieces of work you're proud of." className="resize-none" />
          </div>
          {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
          <DialogFooter className="mt-1 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!at || place.trim().length < 3 || pending}>{pending ? "Sending…" : a.interview ? "Update interview" : "Send invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Decline / Interview / Accept while undecided, Verify for delivered work, otherwise the outcome as a badge. */
export function ApplicantActions({ a, size = "sm" }: { a: Applicant; size?: "sm" | "lg" }) {
  const [busy, start] = useTransition();
  const [verifying, setVerifying] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [changing, setChanging] = useState(false);
  const h = size === "lg" ? "h-9 px-3.5 text-sm" : "h-8 px-3 text-[0.8125rem]";

  const accept = () => start(async () => {
    const r = await acceptApplicantAction(a.id);
    if (r.error) toast.error(r.error); else toast.success(`${firstName(a.name)} is now working on this`, { description: r.notice });
  });
  const decline = () => start(async () => {
    const r = await declineApplicantAction(a.id);
    if (r.error) toast.error(r.error); else toast.success("Applicant declined");
  });

  if (a.status === "pending" || a.status === "interview") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={decline} className={cn("bg-white", h)}>Decline</Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => setInviting(true)} className={cn("gap-1.5 bg-white", h)}>
          <CalendarClock className="size-3.5" />{a.status === "interview" ? "Reschedule" : "Interview"}
        </Button>
        <Button size="sm" disabled={busy} onClick={accept} className={h}>Accept</Button>
        <InterviewDialog key={a.interview?.at ?? "new"} a={a} open={inviting} onOpenChange={setInviting} />
      </div>
    );
  }
  if (a.status === "delivered" && a.projectStatus !== "verified") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setChanging(true)} className={cn("bg-white", h)}>Request changes</Button>
        <Button size="sm" onClick={() => setVerifying(true)} className={h}>Approve and verify</Button>
        <VerifyDialog a={a} open={verifying} onOpenChange={setVerifying} />
        <ChangesDialog a={a} open={changing} onOpenChange={setChanging} />
      </div>
    );
  }
  const [label, tone] = a.status === "declined" ? ["Declined", TONES.muted] : a.projectStatus === "verified" ? ["Verified", TONES.success] : ["Working on it", TONES.success];
  return <span className={cn(chip, tone, size === "lg" && "h-7 text-[0.8125rem]")}>{label}</span>;
}
