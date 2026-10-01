import type { ReactNode } from "react";

type Tone = "startup" | "student" | "platform" | "offer";
const TONES: Record<Tone, string> = {
  startup: "bg-[#fbe3b8] border-[#e39b2e]",
  student: "bg-[#d9e3fb] border-[#2f5bd3]",
  platform: "bg-white border-line",
  offer: "bg-[#fbe3b8] border-[#c77f12] border-[3px]",
};

function Step({ tone, title, children }: { tone: Tone; title: string; children: ReactNode }) {
  return (
    <div className={`flex min-h-[120px] flex-col items-center justify-center rounded-[14px] border-2 p-4 text-center ${TONES[tone]}`}>
      <b className="text-lg">{title}</b>
      <span className="text-[.95rem] text-muted">{children}</span>
    </div>
  );
}
const Arrow = ({ d, className = "" }: { d: string; className?: string }) => (
  <span aria-hidden className={`hidden items-center justify-center text-2xl text-muted md:flex ${className}`}>{d}</span>
);

export const metadata = { title: "How Folio works" };

export default function HowItWorks() {
  return (
    <>
      <h1 className="text-4xl">How it works</h1>
      <p className="mb-10 mt-3 text-[1.05rem] text-muted">Six steps in a loop, plus one bonus exit: the hire. The person posting can be a startup, a small business or another student.</p>

      <ol className="grid list-none gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <li><Step tone="startup" title="1 · Someone posts a task">A startup, SME or student. Any field: data, design, marketing, research.</Step></li>
        <Arrow d="→" />
        <li><Step tone="platform" title="2 · AI writes the brief">Deliverables, scope, price and deadline</Step></li>
        <Arrow d="→" />
        <li><Step tone="platform" title="3 · Matched with a student">Skills, ratings, availability</Step></li>

        <Arrow d="↑" className="md:col-start-1" />
        <li className="hidden md:col-span-3 md:block" aria-hidden />
        <Arrow d="↓" className="md:col-start-5" />

        <li className="md:col-start-1 md:row-start-4"><Step tone="platform" title="6 · Paid, rated, verified">Added to the student&apos;s profile</Step></li>
        <Arrow d="←" className="md:col-start-2 md:row-start-4" />
        <li className="md:col-start-3 md:row-start-4"><Step tone="platform" title="5 · Review & delivery">Work checked against “done when” before handoff</Step></li>
        <Arrow d="←" className="md:col-start-4 md:row-start-4" />
        <li className="md:col-start-5 md:row-start-4"><Step tone="student" title="4 · Student builds it">1–6 weeks, with check-ins</Step></li>
      </ol>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="md:col-start-1">
          <p className="mb-1 hidden pl-1 text-sm font-bold text-amber-ink md:block">↓ great fit</p>
          <Step tone="offer" title="★ Job offer">The client hires the student</Step>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted"><span className="font-semibold">↑ more tasks:</span> a verified student goes back to step 3 and gets matched again.</p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-widest text-muted">Key</span>
        <span className="rounded-full border-2 border-[#e39b2e] bg-[#fbe3b8] px-5 py-2 font-semibold">Client side</span>
        <span className="rounded-full border-2 border-[#2f5bd3] bg-[#d9e3fb] px-5 py-2 font-semibold">Student side</span>
        <span className="rounded-full border-2 border-line bg-white px-5 py-2 font-semibold">Platform</span>
      </div>
    </>
  );
}
