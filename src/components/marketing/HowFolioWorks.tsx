import { ArrowRight, BadgeCheck, CalendarCheck, Check, ClipboardCheck, FileCheck2, FileText, Code2, Handshake, Link2, Lock, Mail, ShieldCheck, Star, UserCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The three sections behind the header links (#getting-paid, #hiring, #trust).
// Keep every claim in step with what the app does today: money doesn't move yet (no Stripe),
// students can't rate companies, and there's no dispute process. Update the copy when those ship.

const card = "rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]";
const eyebrow = "font-mono text-xs font-medium uppercase tracking-wide text-brand";
const iconBox = "grid size-10 shrink-0 place-items-center rounded-lg bg-panel text-brand";

function Heading({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div className="mb-8 max-w-[44rem]">
      <span className={eyebrow}>{label}</span>
      <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-tight">{title}</h2>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------- getting paid (students)

const PAY_STEPS = [
  { icon: Handshake, title: "Agree the price", body: "Every project has a fixed price, set before anyone applies. You know exactly what you’ll earn." },
  { icon: ClipboardCheck, title: "Do the work", body: "Deliver what the project describes. The deliverable is written down up front, so there’s no moving target." },
  { icon: Wallet, title: "Paid on sign-off", body: "The price is paid once the client verifies your delivery. That’s the deal every client agrees to when they post." },
];

export function GettingPaid({ priceRange }: { priceRange: string | null }) {
  return (
    <section id="getting-paid" className="scroll-mt-24 border-t py-14">
      <Heading label="For students" title="How you get paid" sub="Fixed prices, agreed before you start, paid when the client signs off your work." />
      <ol className="grid gap-4 md:grid-cols-3">
        {PAY_STEPS.map((s, i) => (
          <li key={s.title} className={cn(card, "relative flex flex-col gap-3")}>
            <div className="flex items-center justify-between">
              <span className={iconBox}><s.icon className="size-5" /></span>
              <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
            </div>
            <h3 className="text-base font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            {i < PAY_STEPS.length - 1 && <ArrowRight className="absolute -right-3.5 top-1/2 hidden size-5 -translate-y-1/2 rounded-full bg-background text-zinc-400 md:block" />}
          </li>
        ))}
      </ol>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <div className={cn(card, "flex flex-col gap-3 text-sm text-zinc-600")}>
          {priceRange && <p><span className="font-mono text-lg font-semibold text-foreground">{priceRange}</span><span className="block text-xs text-muted-foreground">what open projects pay right now</span></p>}
          <p className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />Add your PayPal payout link to your profile.</p>
          <p className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />Your Payments page shows where every project stands: in escrow, awaiting sign-off, or paid.</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-brand-low bg-soft/40 p-5">
          <Lock className="mt-0.5 size-5 shrink-0 text-brand" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Payments are launching soon</p>
            <p className="mt-1 text-zinc-600">Secure payments through Folio are being built: the client pays into escrow when work starts, and it’s released to you when they verify the delivery. Until then, Folio tracks each project’s price and where its payment stands.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- hiring (companies)

const HIRE_STEPS = [
  { icon: ShieldCheck, title: "Get verified", body: "Tell us who you are: legal name, CIF and website, plus three documents. Folio reviews them, usually within 1–2 business days.",
    chips: ["Registry extract", "Representative ID", "Bank certificate"] },
  { icon: FileText, title: "Post a project", body: "Describe the work, pick the field and skills, set a fixed price and a duration. Write down the deliverable: it’s what you’ll check at the end.",
    chips: ["Fixed price", "Deliverable", "Duration"] },
  { icon: Users, title: "Pick a student", body: "Students apply with a short pitch and their CV. You see how many projects each one has finished and their average rating.",
    chips: ["Pitch + CV", "Past ratings"] },
  { icon: CalendarCheck, title: "Interview if you like", body: "Optionally invite an applicant to an interview, online or in person. Once you hire, you get a message channel with them.",
    chips: ["Meeting link or address", "Messages"] },
  { icon: FileCheck2, title: "Verify the work", body: "Check the delivery against your deliverable, then rate it and write a short review. That becomes the student’s credential.",
    chips: ["Rating", "Review"] },
];

export function Hiring() {
  return (
    <section id="hiring" className="scroll-mt-24 border-t py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading label="For companies" title="How hiring works" sub="From a verified account to verified work, in five steps." />
        <Link href="/company/signup" className={cn(buttonVariants({ size: "lg" }), "mb-8 h-10 px-4 text-sm")}>Create a company account <ArrowRight className="size-4" /></Link>
      </div>
      <ol className="relative grid gap-4 lg:grid-cols-5">
        {HIRE_STEPS.map((s, i) => (
          <li key={s.title} className={cn(card, "flex flex-col gap-3")}>
            <div className="flex items-center gap-3">
              <span className={iconBox}><s.icon className="size-5" /></span>
              <span className="font-mono text-sm text-muted-foreground">Step {i + 1}</span>
            </div>
            <h3 className="text-base font-semibold">{s.title}</h3>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <ul className="flex flex-wrap gap-1.5">
              {s.chips.map((c) => <li key={c} className="rounded-md bg-panel px-2 py-1 text-xs text-zinc-600">{c}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------- trust & accountability (both)

const STUDENT_CHECKS = [
  { icon: Mail, text: "A verified badge for students who sign up with their IE University email" },
  { icon: Link2, text: "LinkedIn, linked by signing in to it, not typed in" },
  { icon: Code2, text: "GitHub too, for tech work" },
];
const COMPANY_CHECKS = [
  { icon: BadgeCheck, text: "Legal name, CIF and website checked" },
  { icon: FileCheck2, text: "Registry extract, representative ID and bank certificate reviewed" },
  { icon: ShieldCheck, text: "Projects only go live once Folio has verified the company" },
];
const SHARED = [
  { icon: ClipboardCheck, title: "“Done” is agreed up front", body: "The deliverable is written into the project before work starts, so both sides know what finished means." },
  { icon: Star, title: "Every project leaves a record", body: "Each finished project ends with a signed rating and review that future clients can see." },
  { icon: UserCheck, title: "Accounts stay on their side", body: "Student and company accounts are separate, and each can only sign in as what it is." },
];

function CheckList({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: { icon: LucideIcon; text: string }[] }) {
  return (
    <div className={cn(card, "flex flex-col gap-4")}>
      <div className="flex items-center gap-3"><span className={iconBox}><Icon className="size-5" /></span><h3 className="text-base font-semibold">{title}</h3></div>
      <ul className="grid gap-3">
        {items.map((it) => <li key={it.text} className="flex items-start gap-2.5 text-sm text-zinc-600"><it.icon className="mt-0.5 size-4 shrink-0 text-brand" />{it.text}</li>)}
      </ul>
    </div>
  );
}

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-24 border-t py-14">
      <Heading label="For everyone" title="Trust & accountability" sub="Companies are checked before they can post, students show who they are, and every project ends with a record of how it went." />
      <div className="grid gap-4 md:grid-cols-2">
        <CheckList icon={UserCheck} title="Students show who they are" items={STUDENT_CHECKS} />
        <CheckList icon={ShieldCheck} title="Every company is verified" items={COMPANY_CHECKS} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {SHARED.map((s) => (
          <div key={s.title} className="flex gap-3 rounded-xl bg-panel p-5">
            <s.icon className="mt-0.5 size-5 shrink-0 text-brand" />
            <div><h3 className="text-sm font-semibold">{s.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
