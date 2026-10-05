"use client";

import { Check, FileText, Search, Star, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Illustrative walkthrough of both sides of Folio. Every name and number here is placeholder data.

type Step = { title: string; body: string; screen: React.ReactNode };

const Shell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
    <div className="flex items-center gap-2 border-b bg-panel px-4 py-2.5">
      <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-2 rounded-full bg-zinc-300" />)}</span>
      <span className="ml-2 truncate text-xs text-muted-foreground">{label}</span>    </div>
    <div className="page-enter flex min-h-0 flex-1 flex-col gap-3 p-5">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="grid gap-1"><span className="text-xs font-medium">{label}</span><span className="rounded-lg border bg-white px-3 py-1.5 text-sm text-zinc-600">{value}</span></div>
);

const Pill = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "blue" }) => (
  <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium",
    tone === "blue" && "bg-soft text-brand", tone === "muted" && "border text-muted-foreground")}>{children}</span>
);

const Btn = ({ children }: { children: React.ReactNode }) => (
  <span className="mt-auto inline-flex h-9 w-fit items-center gap-1.5 self-end rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground">{children}</span>
);

const Stars = () => <span className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-[#f59e0b] text-[#f59e0b]" />)}</span>;

const STUDENT: Step[] = [
  { title: "Find a project", body: "Browse fixed-price projects by field, or let Folio suggest ones that match your CV.", screen: (
    <Shell label="Projects">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground"><Search className="size-4" />Business & Finance</div>
      {[["Delivery route cost model", "€600 · 3 weeks", true], ["Pricing review for a café", "€350 · 2 weeks", false]].map(([t, m, hot]) => (
        <div key={t as string} className={cn("flex items-center justify-between gap-3 rounded-lg border p-3", hot && "border-brand ring-1 ring-brand")}>
          <span><span className="block text-sm font-medium">{t}</span><span className="text-xs text-muted-foreground">Example client · {m}</span></span>
          {hot && <Pill tone="blue">Good match</Pill>}
        </div>
      ))}
    </Shell>
  ) },
  { title: "Apply with a pitch", body: "Write a few lines on how you'd tackle it. Your CV goes with it.", screen: (
    <Shell label="Apply · Delivery route cost model">
      <Field label="Your pitch" value="I'd map each delivery zone's cost per order in a spreadsheet model, then flag the zones that lose money…" />
      <div className="flex items-center gap-2 rounded-lg border bg-panel px-3 py-2 text-sm"><FileText className="size-4 text-muted-foreground" />CV_student.pdf<Pill tone="blue"><Check className="size-3" strokeWidth={3} />Attached</Pill></div>
      <Btn>Send application</Btn>
    </Shell>
  ) },
  { title: "Do the work", body: "Once you're picked, track milestones and deliver against the agreed “done when” test.", screen: (
    <Shell label="In progress · Delivery route cost model">
      <div className="flex items-center justify-between text-sm"><span className="font-medium">Progress</span><span className="font-mono text-xs text-muted-foreground">2 of 3</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full w-2/3 rounded-full bg-brand" /></div>
      {[["Collect order data", true], ["Build the cost model", true], ["Deliver model + summary", false]].map(([t, done]) => (
        <div key={t as string} className="flex items-center gap-2.5 text-sm">
          <span className={cn("grid size-5 place-items-center rounded-full border", done ? "border-brand bg-brand text-white" : "bg-white")}>{done && <Check className="size-3" strokeWidth={3} />}</span>
          <span className={done ? "" : "text-muted-foreground"}>{t}</span>
        </div>
      ))}
      <Btn><Upload className="size-4" />Deliver work</Btn>
    </Shell>
  ) },
  { title: "Get verified", body: "The client signs a rating and review. It lands on your profile as a credential.", screen: (
    <Shell label="Profile · Verified record">
      <div className="rounded-lg border p-4">
        <span className="text-xs text-muted-foreground">Example client · Madrid</span>
        <h4 className="mt-1 font-semibold">Delivery route cost model</h4>
        <p className="mt-2 text-sm italic text-zinc-600">“The client&apos;s review of your work appears here.”</p>
        <div className="mt-3 flex items-center justify-between border-t pt-3"><span className="flex items-center gap-1.5 text-xs font-medium text-brand"><Check className="size-3.5" strokeWidth={3} />Verified by the client</span><Stars /></div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-panel px-3 py-2.5 text-sm"><span>Earned</span><span className="font-mono font-semibold">€600</span></div>
    </Shell>
  ) },
];

const COMPANY: Step[] = [
  { title: "Verify your company", body: "Tell us who you are. Folio checks it before your first project goes live.", screen: (
    <Shell label="Company verification">
      <Field label="Company name" value="Example startup S.L." />
      <Field label="Website" value="example.com" />
      <div className="flex items-center justify-between rounded-lg bg-panel px-3 py-2.5 text-sm"><span>Status</span><Pill tone="blue"><Check className="size-3" strokeWidth={3} />Verified</Pill></div>
    </Shell>
  ) },
  { title: "Post a project", body: "Describe the work, set a fixed price and say exactly when it counts as done.", screen: (
    <Shell label="New project">
      <Field label="Title" value="Delivery route cost model" />
      <div className="grid grid-cols-2 gap-3"><Field label="Price" value="€600" /><Field label="Timeline" value="3 weeks" /></div>
      <Field label="Done when" value="A cost per order for every delivery zone" />
      <Btn>Post project</Btn>
    </Shell>
  ) },
  { title: "Pick a student", body: "Read pitches, open CVs and accept the student who fits best.", screen: (
    <Shell label="Applicants · 3">
      {[["Student A", "Business Analytics · 3rd year", true], ["Student B", "Economics · 4th year", false], ["Student C", "Data & Business · 2nd year", false]].map(([n, p, pick]) => (
        <div key={n as string} className="flex items-center gap-3 rounded-lg border p-3">
          <span className="grid size-9 place-items-center rounded-lg bg-zinc-200 text-xs font-semibold">{(n as string).slice(-1)}</span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{n}</span><span className="block truncate text-xs text-muted-foreground">{p}</span></span>
          {pick ? <Pill tone="blue"><Check className="size-3" strokeWidth={3} />Accepted</Pill> : <Pill>Pitch + CV</Pill>}
        </div>
      ))}
    </Shell>
  ) },
  { title: "Verify the work", body: "Check the delivery against your “done when” test, then rate and sign it off.", screen: (
    <Shell label="Delivered · Delivery route cost model">
      <div className="flex items-center gap-2 rounded-lg border bg-panel px-3 py-2 text-sm"><FileText className="size-4 text-muted-foreground" />route_cost_model.xlsx</div>
      <div className="grid gap-1"><span className="text-xs font-medium">Your rating</span><Stars /></div>
      <Field label="Short review" value="Clear model, delivered on time. We used it the next week." />
      <Btn><Check className="size-4" strokeWidth={3} />Verify & sign</Btn>
    </Shell>
  ) },
];

// Every slide of both flows shows for the same time; the progress bar uses it too.
const STEP_MS = 3000;

const FLOWS = { student: { label: "For students", steps: STUDENT }, company: { label: "For companies", steps: COMPANY } };

export function WorkflowDemo() {
  const [flow, setFlow] = useState<keyof typeof FLOWS>("student");
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const steps = FLOWS[flow].steps;

  // Autoplay through the steps until the visitor takes over (off for reduced motion).
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [auto, flow, step, steps.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-lg bg-muted p-1" role="tablist" aria-label="Workflow">
        {(Object.keys(FLOWS) as (keyof typeof FLOWS)[]).map((k) => (
          <button key={k} role="tab" aria-selected={flow === k} onClick={() => { setFlow(k); setStep(0); setAuto(true); }}
            className={cn("rounded-md px-3 py-1 text-[0.8125rem] font-medium transition-colors", flow === k ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {FLOWS[k].label}
          </button>
        ))}
      </div>

      {/* Fixed height so switching steps never shifts the page. */}
      <div key={`${flow}-${step}`} className="h-[20rem]">{steps[step].screen}</div>

      <div>
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((s, i) => (
            <li key={s.title}>
              <button onClick={() => { setStep(i); setAuto(false); }} aria-current={i === step ? "step" : undefined} className="group flex w-full flex-col gap-1.5 text-left">
                <span className="relative h-1 overflow-hidden rounded-full bg-zinc-200">
                  {i < step && <span className="absolute inset-0 bg-brand" />}
                  {i === step && <span key={`${flow}-${step}-${auto}`} className={cn("absolute inset-0 origin-left bg-brand", auto && "demo-progress")} style={{ animationDuration: `${STEP_MS}ms` }} />}
                </span>
                <span className={cn("text-xs font-medium leading-snug", i === step ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  <span className="font-mono">0{i + 1}</span> {s.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
