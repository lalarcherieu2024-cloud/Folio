import Link from "next/link";
import type { ReactNode } from "react";
import { Plaque } from "@/components/Plaque";
import { Reveal } from "@/components/Reveal";
import { SAMPLE_CREDENTIALS } from "@/lib/mock-data";

export const metadata = { title: "How Folio works" };

const ICONS: Record<string, ReactNode> = {
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  apply: <><path d="M22 3 2 11l7 3 3 7 10-18Z" /><path d="M9 14 22 3" /></>,
  build: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.5-.5-.5-2.5 2.6-2.6Z" />,
  verify: <><circle cx="12" cy="10" r="7" /><path d="m9 10 2 2 4-4M8.5 16 7 22l5-3 5 3-1.5-6" /></>,
  idea: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" /></>,
  brief: <><path d="m12 3 1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></>,
  match: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" /><circle cx="17.5" cy="9" r="2.8" /><path d="M17 14c2.8 0 4.8 2 4.8 5" /></>,
  signoff: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></>,
};

type Step = { icon: keyof typeof ICONS; title: string; body: string };
const STUDENT: Step[] = [
  { icon: "profile", title: "Build your profile", body: "Upload your CV and link GitHub or LinkedIn if you like. No experience needed to start." },
  { icon: "apply", title: "Apply with a short pitch", body: "Browse projects in any field. Each has a fixed price and a clear finish line." },
  { icon: "build", title: "Deliver the work", body: "One to six weeks, with check-ins, against a “done when” test agreed up front." },
  { icon: "verify", title: "Get paid and verified", body: "The client signs a rating and review that lands on your record." },
];
const POSTER: Step[] = [
  { icon: "idea", title: "Describe your idea", body: "A startup, a small business or another student. Rough notes are fine." },
  { icon: "brief", title: "AI writes the brief", body: "Clear deliverables, a “done when” test, a fair price and a deadline." },
  { icon: "match", title: "Pick a student", body: "Compare pitches, CVs and verified records. Choose who fits." },
  { icon: "signoff", title: "Confirm and verify", body: "Check the work, sign off, issue the credential. A great fit can become a job." },
];

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="icon-w" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

function StepCard({ step, n, solid, right }: { step: Step; n: number; solid: boolean; right: boolean }) {
  return (
    <li className={`flex ${right ? "md:justify-end" : "md:justify-start"}`}>
      <Reveal from={right ? "right" : "left"} className="w-full md:w-[60%]">
      <div
        className={`icon-wiggle lift relative w-full rounded-[2rem] border-[3px] p-6 lg:p-8 ${right ? "md:rotate-[1.2deg]" : "md:-rotate-[1.2deg]"} ${
          solid
            ? "border-blue-deep bg-blue text-white shadow-[0_7px_0_var(--blue-deep)]"
            : "border-blue bg-surface text-ink shadow-[0_7px_0_var(--blue)]"
        }`}
      >
        <span className={`absolute -top-4 ${right ? "right-6" : "left-6"} grid h-10 min-w-10 place-items-center rounded-full border-[3px] px-3 font-round text-lg font-black ${solid ? "border-blue-deep bg-[#f6f2ea] text-blue-deep" : "border-blue bg-blue text-white"}`}>{n}</span>
        <div className="flex items-start gap-4">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl lg:h-16 lg:w-16 ${solid ? "bg-white/20 text-white" : "bg-blue-soft text-blue"}`}><Icon name={step.icon} /></span>
          <div>
            <h3 className="font-round text-xl font-extrabold leading-tight lg:text-2xl">{step.title}</h3>
            <p className={`mt-1 lg:text-lg ${solid ? "text-blue-soft" : "text-muted"}`}>{step.body}</p>
          </div>
        </div>
      </div>
      </Reveal>
    </li>
  );
}

// Dashed squiggle between zig-zag cards (desktop) / short dashed line (mobile).
function Connector({ flip }: { flip: boolean }) {
  return (
    <li aria-hidden className="list-none">
      <div className="mx-auto h-9 w-0 border-l-[3px] border-dashed border-blue/40 md:hidden" />
      <div className="hidden justify-center md:flex">
        <svg viewBox="0 0 100 56" preserveAspectRatio="none" className={`h-14 w-[38%] ${flip ? "-scale-x-100" : ""}`} fill="none">
          <path d="M0 0C0 40 100 16 100 56" stroke="var(--blue)" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" className="march" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </li>
  );
}

function Lane({ pill, title, steps, solidFirst, cta }: { pill: string; title: string; steps: Step[]; solidFirst: boolean; cta: { href: string; label: string } }) {
  return (
    <section className="mt-16">
      <Reveal className="mb-10 text-center">
        <span className={`inline-block rounded-full border-[3px] px-5 py-1.5 font-round text-sm font-extrabold ${solidFirst ? "border-blue-deep bg-blue text-white" : "border-blue bg-surface text-blue"}`}>{pill}</span>
        <h2 className="mt-3 font-round text-4xl font-black tracking-tight lg:text-5xl">{title}</h2>
      </Reveal>
      <ol className="flex flex-col">
        {steps.flatMap((s, i) => [
          <StepCard key={s.title} step={s} n={i + 1} solid={solidFirst ? i % 2 === 0 : i % 2 === 1} right={i % 2 === 1} />,
          ...(i < steps.length - 1 ? [<Connector key={`c${i}`} flip={i % 2 === 1} />] : []),
        ])}
      </ol>
      <div className="mt-10 text-center">
        <Link href={cta.href} className="inline-flex items-center gap-2 rounded-full border-[3px] border-blue-deep bg-blue px-7 py-3 font-round text-lg font-extrabold text-white shadow-[0_5px_0_var(--blue-deep)] transition active:translate-y-1 active:shadow-none">{cta.label} <span aria-hidden>→</span></Link>
      </div>
    </section>
  );
}

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="pop-in text-center">
        <span className="inline-block rounded-full bg-blue-soft px-4 py-1.5 font-round text-sm font-extrabold text-blue">How it works</span>
        <h1 className="mt-4 font-round text-[clamp(2.4rem,6vw,5rem)] font-black leading-[1.02] tracking-tight">
          One brief. Two people.<br /><span className="text-blue">Proof that lasts.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[56ch] text-lg text-muted lg:text-xl">Folio connects students who need experience with anyone who needs a project done, and turns every finished project into a verified credential.</p>
      </header>

      <Lane pill="For students" title="Do projects, build proof" steps={STUDENT} solidFirst cta={{ href: "/projects", label: "Find a project" }} />
      <Lane pill="For anyone with a project" title="Get it done by a student" steps={POSTER} solidFirst={false} cta={{ href: "/projects/new", label: "Request help" }} />

      <Reveal className="mt-16"><section className="rounded-[2.5rem] border-[3px] border-blue bg-blue-soft p-7 shadow-[0_7px_0_var(--blue)] md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-blue px-4 py-1.5 font-round text-sm font-extrabold text-white">Where both meet</span>
            <h2 className="mt-3 font-round text-3xl font-black tracking-tight">A signed credential</h2>
            <p className="mt-3 text-muted">When the poster verifies the work, it appears on the student&apos;s public record: the project, the client, the rating and the review. Collect enough and the next project, or job, comes easier.</p>
            <ul className="mt-5 space-y-2 font-bold">
              {["Fixed price, agreed before work starts", "A “done when” test both sides can check", "Credentials only the client can issue"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue text-sm text-white">✓</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-sm rotate-2"><div className="float"><Plaque c={SAMPLE_CREDENTIALS[0]} /></div></div>
        </div>
      </section></Reveal>
    </div>
  );
}
