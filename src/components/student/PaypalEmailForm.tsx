"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { savePaypalEmailAction } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";

/** The PayPal account payouts go to. PayPal pays out to an email address (not a paypal.me link). */
export function PaypalEmailForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePaypalEmailAction, {});
  const [value, setValue] = useState(email ?? "");
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("PayPal email saved");
    if (state.error) toast.error(state.error);
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="paypal-email" className="sr-only">PayPal email</label>
      <div className="flex gap-2">
        <Input id="paypal-email" name="email" type="email" value={value} onChange={(e) => setValue(e.target.value)} placeholder="you@email.com" autoComplete="email" className="h-9 min-w-0 flex-1" />
        <Button type="submit" variant="outline" disabled={pending || value.trim() === (email ?? "")} className="h-9 bg-white px-3">{pending ? "Saving…" : "Save"}</Button>
      </div>
      <span className="text-xs text-muted-foreground">{email ? "Payouts go to this PayPal account." : "Add the email of your PayPal account to get paid."}</span>
    </form>
  );
}
