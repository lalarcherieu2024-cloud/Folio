"use client";

import { ArrowUpRight } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { withdrawAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";

/** Sends the whole available balance to the student's PayPal. */
export function WithdrawButton({ label, amountLabel, disabledReason }: { label: string; amountLabel: string; disabledReason?: string }) {
  const [busy, start] = useTransition();
  const go = () => start(async () => {
    const r = await withdrawAction();
    if (r.error) { toast.error(r.error); return; }
    toast.success("Withdrawal sent", { description: `${amountLabel} is on its way to your PayPal.` });
  });
  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" disabled={busy || !!disabledReason} onClick={go} className="h-9 gap-1.5 px-3.5"><ArrowUpRight className="size-4" />{busy ? "Sending…" : label}</Button>
      {disabledReason && <span className="text-xs text-muted-foreground">{disabledReason}</span>}
    </div>
  );
}
