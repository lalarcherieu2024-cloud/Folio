"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { startPaymentAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";

/** Pays for the project: goes to PayPal in real mode, or completes at once in test mode. */
export function PayButton({ projectId, label, mode }: { projectId: string; label: string; mode: "paypal" | "simulated" }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const pay = () => start(async () => {
    const r = await startPaymentAction(projectId);
    if (r.error) { toast.error(r.error); return; }
    if (r.url) { window.location.href = r.url; return; }       // PayPal checkout
    toast.success("Payment received", { description: "Your project is now visible to students." });
    router.replace(`/company/projects/${projectId}?paid=1`);
  });
  return (
    <Button type="button" disabled={busy} onClick={pay} className="h-10 gap-2 px-4">
      <Lock className="size-4" />{busy ? (mode === "paypal" ? "Opening PayPal…" : "Paying…") : label}
    </Button>
  );
}
