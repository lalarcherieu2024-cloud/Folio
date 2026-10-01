import type { ReactNode } from "react";

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-semibold">{label}</label>
      {children}
      {hint && <small className="text-sm text-muted">{hint}</small>}
    </div>
  );
}

export function FormError({ msg }: { msg?: string }) {
  return msg ? <p role="alert" className="shake mb-3 text-sm font-semibold text-red">{msg}</p> : null;
}
