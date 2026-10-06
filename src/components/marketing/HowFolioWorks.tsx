import { Plus, ShieldCheck } from "lucide-react";
import { ApplicantsSnippet, CredentialSnippet, EscrowSnippet } from "@/components/marketing/Snippets";
import { FEE_RATE } from "@/lib/data/shared";
import { cn } from "@/lib/utils";

// The sections between the hero and the projects (#hiring, #getting-paid, #students, #trust): each is a hook
// headline, a line or three, and one small product snippet beside it, alternating sides. Keep every claim in step
// with what the app does today: real money only moves once PAYMENTS_MODE=paypal (the money section says so),
// students can't rate companies, and there's no dispute process beyond what the Terms describe.

// ---------------------------------------------------------------- the shared layout

/** Text on one side, a product snippet on the other; `flip` puts the snippet first. Stacks on phones, text first. */
function Split({ id, flip, rule = true, className, text, visual }: { id: string; flip?: boolean; rule?: boolean; className?: string; text: React.ReactNode; visual: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-14 md:py-20", rule && "section-rule", className)}>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className={cn("min-w-0", flip && "md:order-2")}>{text}</div>
        <div className={cn("min-w-0", flip && "md:order-1")}>{visual}</div>
      </div>
    </section>
  );
}

const kicker = "text-sm font-medium text-brand";
const hook = "mt-2 text-balance text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.1] tracking-tight";
const lead = "mt-4 max-w-[34rem] text-pretty text-lg leading-relaxed text-zinc-600";

// ---------------------------------------------------------------- for companies

const COMPANY_POINTS = ["Post a brief with a fixed price.", "Students apply. Interview if you like.", "Approve the work, rate it, done."];

export function ForCompanies() {
  return (
    // Straight after the hero, so no divider: it carries on from the demo.
    <Split id="hiring" rule={false} className="pt-8 md:pt-10"
      text={<>
        <p className={kicker}>For companies</p>
        <h2 className={hook}>Hire an IE student this week. Pay only when the work is right.</h2>
        <ol className="mt-7 flex flex-col gap-4">
          {COMPANY_POINTS.map((p, i) => (
            <li key={p} className="flex items-baseline gap-4 text-lg text-zinc-700">
              <span className="w-6 shrink-0 text-2xl font-semibold tabular-nums text-brand">{i + 1}</span>{p}
            </li>
          ))}
        </ol>
      </>}
      visual={<ApplicantsSnippet />} />
  );
}

// ---------------------------------------------------------------- the money (both sides)

export function MoneySection({ paymentsLive }: { paymentsLive: boolean }) {
  const price = 600, feePercent = Math.round(FEE_RATE * 100), total = Math.round(price * (1 + FEE_RATE)), fee = total - price;
  return (
    // On a soft tinted band, so the middle of the story stands apart from the sections around it.
    <Split id="getting-paid" flip rule={false} className="rounded-3xl bg-soft/50 px-6 md:px-12"
      text={<>
        <p className={kicker}>For both sides</p>
        <h2 className={hook}>The money is there before the work starts.</h2>
        <p className={lead}>The company pays Folio up front, plus a {feePercent}% fee. We hold it, and release it to the student the moment the work is approved.</p>
        {/* Honest about the pilot: until real payments are switched on (PAYMENTS_MODE=paypal), no money moves. */}
        {!paymentsLive && <p className="mt-5 flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground"><ShieldCheck className="size-4 text-brand" />Pilot: payments run in test mode, so no real money moves yet.</p>}
      </>}
      visual={<EscrowSnippet total={total} price={price} fee={fee} />} />
  );
}

// ---------------------------------------------------------------- for students

export function ForStudents({ priceRange }: { priceRange: string | null }) {
  return (
    <Split id="students"
      text={<>
        <p className={kicker}>For students</p>
        <h2 className={hook}>Get paid, and leave with proof.</h2>
        <p className={lead}>
          Every finished project becomes a credential the client signs, on your profile for the next one to see.
          {priceRange && <> Open projects pay <span className="font-semibold tabular-nums text-foreground">{priceRange}</span>.</>}
        </p>
      </>}
      visual={<CredentialSnippet />} />
  );
}

// ---------------------------------------------------------------- what if… (both)
// Keep every answer in step with what the app and the Terms say today.

const QUESTIONS = [
  { q: "…the company isn't real?", a: "Folio checks every company before it can post: its CIF, website and the founder's LinkedIn. Before its first payment, it also confirms it can act for the company." },
  { q: "…the student isn't who they say?", a: "Students confirm an IE University email to use Folio, and can connect LinkedIn for a verified badge." },
  { q: "…the work isn't good enough?", a: "What “done” means is written in the brief before work starts. The company can ask for changes, and the money stays held while they're made." },
  { q: "…the company never responds?", a: "If a delivery isn't checked within 14 days, Folio may review it and release the payment if it meets the brief." },
  { q: "…I change my mind before hiring?", a: "Cancel the project before anyone is hired and the payment is refunded." },
];

export function WhatIf() {
  return (
    <section id="trust" className="section-rule scroll-mt-24 py-14 md:py-20">
      <div className="grid gap-8 md:grid-cols-[1fr_1.6fr] md:gap-14">
        <div>
          <p className={kicker}>Trust</p>
          <h2 className={hook}>What if…</h2>
          <p className="mt-3 text-zinc-600">The questions people ask before their first project.</p>
        </div>
        <div className="border-t">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="-mt-1 pb-5 pr-8 leading-relaxed text-zinc-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
