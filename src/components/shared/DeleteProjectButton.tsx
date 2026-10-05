"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeProjectAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Delete a project you no longer want to run. If it was already paid, the label and text become "cancel and refund". */
export function DeleteProjectButton({ projectId, title, refund, redirectTo, noun = "project" }: { projectId: string; title: string; refund?: string; redirectTo: string; noun?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();

  const go = () => start(async () => {
    const r = await removeProjectAction(projectId);
    if (r.error) { toast.error(r.error); return; }
    toast.success(r.kind === "cancelled" ? "Project cancelled" : "Project deleted", { description: r.kind === "cancelled" ? "Your payment is being refunded." : undefined });
    setOpen(false);
    router.push(redirectTo);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 bg-white px-3 text-[0.8125rem] text-destructive hover:bg-red-50 hover:text-destructive" />}>
        <Trash2 className="size-3.5" />{refund ? `Cancel ${noun}` : `Delete ${noun}`}
      </DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[26rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{refund ? `Cancel this ${noun}?` : `Delete this ${noun}?`}</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{title}</span> {refund ? `will be cancelled and removed from Find projects. Your payment of ${refund} is refunded in full.` : "will be removed for good."}
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Anyone who already applied is told it was removed.</li>
          <li>You can post it again later if you change your mind.</li>
        </ul>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Keep it</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={go}>{busy ? "Working…" : refund ? "Cancel and refund" : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
