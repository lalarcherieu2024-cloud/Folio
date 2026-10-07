import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ApplicantsSnippet, CredentialSnippet, EscrowSnippet } from "@/components/marketing/Snippets";
import { FEE_RATE } from "@/lib/data/shared";
import { STARTUP_MAX_PAY } from "@/lib/org";
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
    <Split id="hiring" rule={false} className="pt-16 md:pt-24"
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
        {/* Student founders hire through their own startup account (migration 0031). */}
        <p className="mt-7 text-[0.9375rem] text-muted-foreground">
          Student founder at IE? <Link href="/company/signup?founder=1" className="font-medium text-foreground underline underline-offset-4 hover:text-brand">You can hire too</Link>, even before your startup is registered.
        </p>
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
// Keep every answer in step with what the app and the Terms say today (fees, refunds, disagreements and ownership are
// all in the Terms).

const FEE = Math.round(FEE_RATE * 100);
// One list, in the order people tend to wonder: is it safe, what if the work goes wrong, the money, getting started.
const QUESTIONS: { q: string; a: string }[] = [
  { q: "…the company isn't real?", a: "Folio checks every company by hand before it can post: its CIF and website (for a student startup, the founder's IE email). Before its first payment, it also confirms who can act for it." },
  { q: "…the student isn't who they say?", a: "Every student confirms an IE University email to use Folio, and can connect LinkedIn for a verified badge." },
  { q: "…the work isn't good enough?", a: "What “done” means is written in the brief before work starts. The company can ask for changes, and the money stays held while they're made." },
  { q: "…we can't agree whether it meets the brief?", a: "Either side can ask Folio to look at it. We review the brief, the delivery and the messages, then release the payment, refund it or split it, aiming to decide within 14 days." },
  { q: "…the company never responds?", a: "If a delivery isn't checked within 14 days, Folio may review it and release the payment if it meets the brief." },
  { q: "…we want to keep the work?", a: "Once the payment is released, the rights to use the deliverables pass to the company, unless the brief says otherwise. The student can still show the project in their portfolio, unless it's marked confidential." },
  { q: "…I want to know what it costs?", a: `Students pay nothing. Companies pay the project price plus a ${FEE}% fee, up front, and Folio holds it until the work is approved.` },
  { q: "…I'm not sure what to pay?", a: "When you post a project, Folio shows what similar open projects pay right now. The minimum is €150." },
  { q: "…I'm waiting to get paid?", a: "The moment the company approves your work, the price goes to your Folio balance, ready to withdraw to PayPal." },
  { q: "…I change my mind before hiring?", a: "Cancel the project before anyone starts on it and you get the full payment back, fee included." },
  { q: "…I've never hired anyone before?", a: "Folio walks you through it: brief templates to start from, and a step-by-step guide from writing the brief to signing the student's credential." },
  { q: "…I'm a student with my own startup?", a: `You can hire too, with a separate startup account. Until it's registered, projects go up to €${STARTUP_MAX_PAY} and we only ask for your ID before the first payment.` },
  { q: "…I'm not an IE student?", a: "Then you can't take projects yet: student accounts are for IE University only. Companies and organisations of any kind can hire, once Folio has checked them." },
];

export function WhatIf() {
  return (
    <section id="trust" className="section-rule scroll-mt-24 py-14 md:py-20">
      <div className="grid gap-8 md:grid-cols-[1fr_1.7fr] md:gap-14">
        <div className="md:sticky md:top-28 md:self-start">
          <p className={kicker}>Questions</p>
          <h2 className={hook}>What if…</h2>
          <p className="mt-3 max-w-[28ch] text-pretty text-zinc-600">The questions people ask before their first project, answered plainly.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group rounded-xl border border-transparent transition-colors open:border-border open:bg-white open:shadow-[0_1px_2px_rgba(0,0,0,.04)] hover:bg-white/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-[1.0625rem] font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-white text-muted-foreground transition-colors group-open:border-brand group-open:bg-brand group-open:text-white">
                  <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" />
                </span>
              </summary>
              <p className="-mt-1 px-4 pb-4 pr-14 leading-relaxed text-zinc-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
