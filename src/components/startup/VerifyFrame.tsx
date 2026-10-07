"use client";

import { Check, ChevronDown, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { saveCompanyDetailsDraftAction } from "@/app/actions/startup";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

// The frame for company verification (/company/verify): a calm, document-style layout like a bank or payment
// provider's business check, rather than the sign-up's marketing panel. A slim bar with a "secure" note and the way
// out (Save and exit), a compact step list, the current step in the middle, and how the documents are handled.

// Stage 1 only, in one step (migration 0032); the documents come later, before the first payment (a note under the
// steps).
const STEPS = [
  { title: "Your company", sub: "A few details, about 2 minutes" },
  { title: "Folio review", sub: "Usually 1–2 business days" },
] as const;

// Leaves for the dashboard, first saving the company details form if it's on the page and has been changed (so
// nothing typed is lost). Documents already save as they're uploaded.
function FinishLater() {
  const router = useRouter();
  const [saving, start] = useTransition();
  const go = () => {
    const form = document.getElementById("company-details-form") as HTMLFormElement | null;
    const changed = form && [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input:not([type=hidden]), textarea")].some((el) => el.value !== el.defaultValue);
    if (!form || !changed) { router.push("/company"); return; }
    start(async () => {
      const r = await saveCompanyDetailsDraftAction(new FormData(form)); // redirects to the dashboard when it saves
      if (r?.error) toast.error(r.error, { action: { label: "Leave without saving", onClick: () => router.push("/company") } });
    });
  };
  return (
    <button type="button" onClick={go} disabled={saving} title="Saves what you've filled in. Pick it up from your dashboard."
      className="inline-flex h-9 items-center rounded-lg border bg-white px-3.5 text-sm font-medium text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition-colors hover:bg-panel hover:text-foreground disabled:opacity-60">
      {saving ? "Saving…" : "Save and exit"}
    </button>
  );
}

// Mirrors the Privacy Policy's "Company verification" section; keep them in step.
const HANDLING = [
  ["Now", "We check your CIF (or, for a student startup, your IE email) and website against public records, so students only see genuine companies"],
  ["Before your first payment", "The representative's ID, and the registry extract for a registered company, to confirm you can act for it"],
  ["Who sees them", "Only you and Folio's review team. Students never do; they see your name, logo and a verified badge"],
  ["Where", "Encrypted, in private storage with our database provider (Supabase)"],
  ["How long", "While your company account is open; deleted within 30 days of closing it"],
  ["Your control", "Replace or remove documents until your first payment, and ask us to see or delete them any time"],
] as const;

export function VerifyFrame({ step, allDone, stepHref, children }: {
  /** 1–2 in STEPS. */
  step: number; allDone?: boolean; stepHref?: (n: number) => string | null; children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[68rem] items-center gap-3 px-5">
          <Link href="/company" className="flex items-center gap-2" aria-label="Folio home"><Logo size={36} animated={false} /><span className="text-lg font-semibold tracking-tight">Folio</span></Link>
          <span className="h-5 w-px bg-border" aria-hidden />
          <span className="text-sm font-medium text-zinc-600">Company verification</span>
          <span className="flex-1" />
          <span className="hidden items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-zinc-600 sm:inline-flex">
            <ShieldCheck className="size-3.5 text-[#16a34a]" />Encrypted and private
          </span>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          {/* The one way out, where people look for it: everything saved so far stays, and the dashboard keeps the
              verification card (and the account menu, with sign out). */}
          <FinishLater />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[68rem] flex-1 gap-8 px-5 py-10 md:grid-cols-[15rem_1fr] md:gap-12">
        <aside className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
          <ol className="flex flex-col gap-1" aria-label="Verification steps">
            {STEPS.map((s, i) => {
              const n = i + 1, done = n < step || !!allDone, cur = n === step && !done;
              const href = !cur ? stepHref?.(n) : null;
              const body = (
                <>
                  <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums",
                    done ? "border-[#16a34a] bg-[#16a34a] text-white" : cur ? "border-brand bg-brand text-white" : "bg-white text-muted-foreground")}>
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className={cn("text-sm font-medium", cur ? "text-foreground" : done ? "text-zinc-700" : "text-muted-foreground")}>{s.title}</span>
                    <span className="text-xs text-muted-foreground">{s.sub}</span>
                  </span>
                </>
              );
              const cls = cn("flex gap-3 rounded-lg px-3 py-2.5", cur && "bg-white shadow-[0_0_0_1px_var(--color-border)]");
              return (
                <li key={s.title} aria-current={cur ? "step" : undefined}>
                  {href ? <Link href={href} className={cn(cls, "hover:bg-white")}>{body}</Link> : <div className={cls}>{body}</div>}
                </li>
              );
            })}
          </ol>
          <p className="flex gap-2.5 px-3 text-xs leading-relaxed text-muted-foreground">
            <FileText className="mt-0.5 size-3.5 shrink-0" />
            <span>No documents needed now. Before your first payment we&apos;ll ask for the representative&apos;s ID, and a registered company&apos;s registry extract.</span>
          </p>
          {/* Plain-language summary of how the documents are handled; the full version is in the Privacy Policy. */}
          <details className="group rounded-lg border bg-white text-xs leading-relaxed text-muted-foreground" open>
            <summary className="flex cursor-pointer list-none items-center gap-2 p-3.5 font-medium text-foreground [&::-webkit-details-marker]:hidden">
              <ShieldCheck className="size-4 shrink-0 text-brand" />How we handle your documents
              <ChevronDown className="ml-auto size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <ul className="flex flex-col gap-2 border-t px-3.5 pb-3.5 pt-3">
              {HANDLING.map(([t, d]) => <li key={t}><span className="font-medium text-zinc-700">{t}.</span> {d}</li>)}
              <li><Link href="/legal/privacy#company-verification" className="font-medium text-brand underline-offset-2 hover:underline">Read the full details</Link></li>
            </ul>
          </details>
        </aside>
        <main className="flex min-w-0 max-w-[40rem] flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
