"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { registerStartupAction } from "@/app/actions/startup";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";
import { STARTUP_MAX_PAY } from "@/lib/org";
import { Field } from "./CompanyAuth";

/** A student startup that got registered becomes a company (register_startup, migration 0031): no more €500 cap, and
 *  the registry extract is asked for before its next payment. On the company profile. */
export function RegisterStartupCard({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(registerStartupAction, {});
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    // Saved: the page refreshes as a company, so this card goes away by itself.
    if (state.ok) toast.success("Registered", { description: "Your startup is now a company on Folio." });
    if (state.error) toast.error(state.error);
  }, [state]);
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">Registered your startup?</span>
          <span className="text-[0.8125rem] text-muted-foreground">Add its legal name and CIF to lift the €{STARTUP_MAX_PAY} limit per project. Before your next payment we&apos;ll ask for the registry extract.</span>
        </div>
        {!open && <Button type="button" variant="outline" onClick={() => setOpen(true)} className="h-9 bg-white px-3.5">Add registration</Button>}
      </div>
      {open && (
        <form action={action} className="grid gap-3">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
            <Field id="legalName" label="Legal name" defaultValue={name} placeholder={`${name} S.L.`} required />
            <Field id="cif" label="CIF / NIF" placeholder="B12345678" required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-9 px-3">Cancel</Button>
            <Button type="submit" disabled={pending} className="h-9 px-3.5">{pending ? "Saving…" : "Save registration"}</Button>
          </div>
        </form>
      )}
    </section>
  );
}
