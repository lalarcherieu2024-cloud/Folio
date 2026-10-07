"use client";

import { ArrowDown, ArrowUp, Banknote, Building2, Check, Eye, FileText, GraduationCap, MousePointer2, Search, Send, Star, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Illustrative walkthrough of one project moving between a company (top) and a student (bottom).
// Every name and number here is placeholder data.

type Side = "company" | "student";
// color: the step's accent as [ring, text, tint], the same palette the app uses for each project stage.
// handoff: what just happened, in a sentence shown between the windows. flow: which way it travels
// (defaults to away from the actor).
type Step = {
  title: string; actor: Side; handoff: string; flow?: "up" | "down"; color: [string, string, string];
  company: React.ReactNode; student: React.ReactNode;
};

const SIDES = { company: { label: "Company", icon: Building2 }, student: { label: "Student", icon: GraduationCap } };

// One app window that holds the three chapters in a tall page that snaps from chapter to chapter. Inside a
// chapter its steps swap in place. Autoplay scrolls it for the visitor; they can also scroll it themselves
// (touch, keys here; the wheel anywhere on the demo).
type WindowProps = {
  side: Side; step: number;
  scrollerRef: React.RefObject<HTMLDivElement | null>; onScroll: (side: Side) => void; onTakeOver: (side: Side) => void;
};

const Window = ({ side, step, scrollerRef, onScroll, onTakeOver }: WindowProps) => {
  const { label: role, icon: Icon } = SIDES[side];
  const active = STEPS[step].actor === side || step === STEPS.length - 1;
  const chapter = chapterOf(step);
  const take = () => onTakeOver(side);
  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)] transition-[border-color,opacity] duration-300",
      active ? "border-[var(--c)] shadow-[0_0_0_3px_var(--c-tint)]" : "opacity-60 hover:opacity-90")}>
      <div className="relative flex items-center gap-2 border-b bg-panel px-4 py-2 transition-colors duration-300" style={active ? { background: "var(--c-tint)" } : undefined}>
        {/* Runs for as long as this step is shown, so a held step still moves. */}
        {active && <span key={step} className="demo-timer absolute inset-x-0 -bottom-px h-0.5 origin-left bg-[var(--c)]" style={{ animationDuration: `${STEP_MS}ms` }} />}
        <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-2 rounded-full bg-zinc-300" />)}</span>
        <span className="ml-2 min-w-0 flex-1 truncate text-xs text-muted-foreground">{STEPS[step].title} · {PROJECT}</span>
        <span className={cn("inline-flex items-center gap-1 text-xs font-medium", active ? "text-[var(--c-fg)]" : "text-muted-foreground")}><Icon className="size-3.5" />{role}</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={scrollerRef} onScroll={() => onScroll(side)} onTouchStart={take} onPointerDown={take} onKeyDown={take}
          tabIndex={0} aria-label={`${SIDES[side].label} screens, scroll to move between chapters`}
          className="h-full snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden">
          {CHAPTERS.map((c, i) => {
            // Chapters above the current one rest on their outcome, those below on their opening step.
            const shown = i === chapter ? step : i < chapter ? c.end - 1 : c.start;
            // The step before fades out on top while the new one comes in, so a change is never a hard cut.
            const leaving = i === chapter && step > c.start ? step - 1 : null;
            return (
              <div key={c.title} aria-hidden={i !== chapter} className="relative h-full snap-start snap-always">
                <div key={shown} data-active={shown === step || undefined} className="demo-pane flex h-full flex-col gap-2.5 p-4">{STEPS[shown][side]}</div>
                {leaving !== null && <div key={`out-${leaving}`} aria-hidden className="demo-leave pointer-events-none absolute inset-0 flex flex-col gap-2.5 bg-white p-4">{STEPS[leaving][side]}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="grid gap-1"><span className="text-xs font-medium">{label}</span><span className="rounded-lg border bg-white px-3 py-1.5 text-sm text-zinc-600"><span className="demo-type block truncate">{value}</span></span></div>
);

const TONES = {
  muted: "border text-muted-foreground",
  blue: "bg-[#e0f2fe] text-[#0c4a6e] demo-breathe",
  amber: "bg-[#fef3c7] text-[#92400e] demo-pop",
  violet: "bg-[#ede9fe] text-[#6d28d9] demo-pop",
  green: "bg-[#dcfce7] text-[#166534] demo-ok",
};

// amber/violet pop in and green ones also pulse when their screen scrolls into view (see globals.css).
const Pill = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: keyof typeof TONES }) => (
  <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium", TONES[tone])}>{children}</span>
);

const Ok = ({ children }: { children: React.ReactNode }) => <Pill tone="green"><Check className="size-3" strokeWidth={3} />{children}</Pill>;

// A cursor glides in and clicks the button (demo-cursor and demo-press share the timing in globals.css).
const Btn = ({ children }: { children: React.ReactNode }) => (
  <span className="demo-press relative mt-auto inline-flex h-8 w-fit shrink-0 items-center gap-1.5 self-end whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
    {children}
    <span aria-hidden className="demo-ripple pointer-events-none absolute -bottom-2.5 right-[0.6rem] size-5 rounded-full border-2 border-white/80" />
    {/* x and y ease differently, so the cursor arcs in instead of sliding in a straight line. */}
    <span aria-hidden className="demo-cursor-x pointer-events-none absolute -bottom-2.5 right-3">
      <span className="demo-cursor-y block"><MousePointer2 className="demo-cursor size-4 fill-white text-zinc-900 drop-shadow" /></span>
    </span>
  </span>
);

const Stars = () => (
  <span className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="demo-star size-4 fill-[#f59e0b] text-[#f59e0b]" style={{ animationDelay: `${0.56 + i * 0.11}s` }} />)}</span>
);

const FileRow = ({ children, pill, upload }: { children: React.ReactNode; pill?: React.ReactNode; upload?: boolean }) => (
  <div className="relative flex items-center gap-2 overflow-hidden rounded-lg border bg-panel px-3 py-2 text-sm">
    <FileText className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{children}</span>{pill}
    {upload && <span className="demo-upload absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#22c55e]" />}
  </div>
);

const ROWS = { plain: "", new: "border-[#fcd34d] bg-[#fffbeb]", accepted: "demo-ok-row border-[#86efac] bg-[#f0fdf4]" };

const Applicant = ({ name, field, pill, row = "plain" }: { name: string; field: string; pill: React.ReactNode; row?: keyof typeof ROWS }) => (
  <div className={cn("flex items-center gap-3 rounded-lg border p-2.5", ROWS[row])}>
    <span className={cn("grid size-8 place-items-center rounded-lg text-xs font-semibold", row === "accepted" ? "bg-[#22c55e] text-white" : row === "new" ? "bg-[#fde68a] text-[#92400e]" : "bg-zinc-200")}>{name.slice(-1)}</span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{name}</span><span className="block truncate text-xs text-muted-foreground">{field}</span></span>
    {pill}
  </div>
);

const Progress = ({ done, color }: { done: number; color: string }) => (
  <>
    <div className="flex items-center justify-between text-sm"><span className="font-medium">Milestones</span><span className="tabular-nums text-xs text-muted-foreground">{done} of 3</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="demo-fill h-full origin-left rounded-full" style={{ width: `${(done / 3) * 100}%`, backgroundColor: color }} /></div>
  </>
);

const Req = ({ children, done }: { children: React.ReactNode; done?: boolean }) => (
  <span className={cn("inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs", done ? "demo-ok border-[#86efac] bg-[#f0fdf4] text-[#166534]" : "bg-white text-zinc-600")}>
    {done && <Check className="size-3" strokeWidth={3} />}{children}
  </span>
);

const REQUIREMENTS = ["2025 orders", "Cost per zone", "Summary"];

const Milestones = ({ done, color }: { done: number; color: string }) => (
  <div className="grid gap-1.5">
    {["Collect order data", "Build the cost model", "Deliver model + summary"].map((t, i) => (
      <div key={t} className="flex items-center gap-2 text-sm">
        <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", i < done ? "text-white" : "bg-white")} style={i < done ? { background: color, borderColor: color } : undefined}>
          {i < done && <Check className="size-2.5" strokeWidth={3.5} />}
        </span>
        <span className={i < done ? "" : "text-muted-foreground"}>{t}</span>
      </div>
    ))}
  </div>
);

const PROJECT = "Delivery route cost model";

// Both windows play the same step at once: what one side does, the other side sees happen.
const C = { blue: ["#0284c7", "#0c4a6e", "#e0f2fe"], amber: ["#f59e0b", "#92400e", "#fef3c7"], cyan: ["#0891b2", "#155e75", "#cffafe"],
  green: ["#22c55e", "#166534", "#dcfce7"], navy: ["#0369a1", "#0c4a6e", "#e0f2fe"], violet: ["#8b5cf6", "#6d28d9", "#ede9fe"] } satisfies Record<string, Step["color"]>;

const STEPS: Step[] = [
  { title: "Post listing", actor: "company", handoff: "Company posted the listing", color: C.blue,
    company: (
      <>
        <Field label="New listing" value={PROJECT} />
        <div className="flex items-center gap-2 text-sm text-zinc-600"><span className="tabular-nums">€600 · 3 weeks</span><Pill>Business & Finance</Pill></div>
        <Btn>Post listing</Btn>
      </>
    ),
    student: (
      <>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground"><Search className="size-4" />Business & Finance</div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#7dd3fc] bg-[#f0f9ff] p-3 ring-1 ring-[#7dd3fc]">
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{PROJECT}</span><span className="text-xs text-muted-foreground">Example client · €600 · 3 weeks</span></span>
          <Pill tone="blue">New</Pill>
        </div>
      </>
    ) },
  { title: "Apply", actor: "student", handoff: "Student applied with a pitch + CV", color: C.amber,
    company: (
      <>
        <Applicant name="Student A" field="Business Analytics · 3rd year" row="new" pill={<Pill tone="amber">New pitch</Pill>} />
        <Applicant name="Student B" field="Economics · 4th year" pill={<Pill>Pitch + CV</Pill>} />
      </>
    ),
    student: (
      <>
        <Field label="Your pitch" value="I'd map each delivery zone's cost per order, then flag the zones that lose money…" />
        <FileRow upload pill={<Ok>Attached</Ok>}>CV_student.pdf</FileRow>
        <Btn><Send className="size-4" />Send application</Btn>
      </>
    ) },
  { title: "Review", actor: "company", handoff: "Company is reviewing the application", color: C.cyan,
    company: (
      <>
        <div className="rounded-lg border border-[#a5f3fc] bg-[#ecfeff] p-3">
          <span className="flex items-center justify-between text-sm font-medium">Student A<Pill tone="blue"><Eye className="size-3" />Reading</Pill></span>
          <p className="mt-1 truncate text-xs text-zinc-600">“I&apos;d map each delivery zone&apos;s cost per order, then flag…”</p>
        </div>
        <FileRow pill={<Pill>Opened</Pill>}>CV_student.pdf</FileRow>
      </>
    ),
    student: (
      <>
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{PROJECT}</span><span className="text-xs text-muted-foreground">Applied today</span></span>
          <Pill tone="blue"><Eye className="size-3" />Under review</Pill>
        </div>
        <p className="text-xs text-muted-foreground">The client opened your pitch and CV.</p>
      </>
    ) },
  { title: "Approve", actor: "company", handoff: "Company approved the student", color: C.green,
    company: (
      <>
        <Applicant name="Student A" field="Business Analytics · 3rd year" row="accepted" pill={<Ok>Approved</Ok>} />
        <Applicant name="Student B" field="Economics · 4th year" pill={<Pill>Pitch + CV</Pill>} />
      </>
    ),
    student: (
      <div className="demo-ok-row flex items-center justify-between gap-3 rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3">
        <span className="min-w-0"><span className="block text-sm font-medium">You&apos;re selected!</span><span className="block truncate text-xs text-muted-foreground">{PROJECT} · brief on its way</span></span>
        <Ok>Approved</Ok>
      </div>
    ) },
  { title: "Brief & deposit", actor: "company", handoff: "Company sent the brief + €600 down payment", color: C.navy,
    company: (
      <>
        <div className="grid gap-1"><span className="text-xs font-medium">Requirements</span><div className="flex flex-wrap gap-1.5">{REQUIREMENTS.map((r) => <Req key={r}>{r}</Req>)}</div></div>
        <div className="flex items-center gap-2 rounded-lg border bg-panel px-3 py-2 text-sm"><Banknote className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">Down payment · €600</span><Ok>Paid</Ok></div>
        <Btn><Send className="size-4" />Send brief</Btn>
      </>
    ),
    student: (
      <>
        <span className="text-xs font-medium">Brief from Example client</span>
        <div className="grid gap-1">{REQUIREMENTS.map((r) => <span key={r} className="flex items-center gap-2 text-sm"><span className="size-1.5 rounded-full bg-[#0369a1]" />{r}</span>)}</div>
        <div className="demo-ok-row mt-auto flex items-center gap-2 rounded-lg border border-[#86efac] bg-[#f0fdf4] px-3 py-2 text-sm text-[#166534]"><Banknote className="size-4" />€600 secured in escrow</div>
      </>
    ) },
  { title: "Accept", actor: "student", handoff: "Student accepted the brief and started", color: C.green,
    company: (
      <>
        <Applicant name="Student A" field="Accepted your brief · starts today" row="accepted" pill={<Ok>Started</Ok>} />
        <Progress done={0} color="#0369a1" />
      </>
    ),
    student: (
      <>
        <div className="flex items-center justify-between text-sm"><span className="font-medium">{PROJECT}</span><span className="tabular-nums text-xs text-muted-foreground">€600 · 3 wk</span></div>
        <div className="flex items-center gap-2 text-sm"><span className="demo-ok grid size-4 place-items-center rounded bg-[#22c55e] text-white"><Check className="size-3" strokeWidth={3.5} /></span>I agree to the brief and the &ldquo;done when&rdquo; test</div>
        <Btn><Check className="size-4" strokeWidth={3} />Accept & start</Btn>
      </>
    ) },
  { title: "Work", actor: "student", handoff: "Student is ticking off milestones", color: C.navy,
    company: (
      <>
        <Progress done={2} color="#0369a1" />
        <p className="text-xs text-muted-foreground">Student A finished “Build the cost model” · 2h ago</p>
      </>
    ),
    student: (
      <>
        <Progress done={2} color="#0369a1" />
        <Milestones done={2} color="#0369a1" />
      </>
    ) },
  { title: "Submit", actor: "student", handoff: "Student submitted the work", color: C.violet,
    company: (
      <>
        <FileRow pill={<Pill tone="violet">New delivery</Pill>}>route_cost_model.xlsx</FileRow>
        <FileRow>summary.pdf</FileRow>
      </>
    ),
    student: (
      <>
        <Progress done={3} color="#8b5cf6" />
        <FileRow upload pill={<Ok>Uploaded</Ok>}>route_cost_model.xlsx</FileRow>
        <Btn><Upload className="size-4" />Submit work</Btn>
      </>
    ) },
  { title: "Verify", actor: "company", handoff: "Company checked the work against the brief", color: C.cyan,
    company: (
      <>
        <span className="text-xs font-medium">Done when: a cost per order for every delivery zone</span>
        <div className="flex flex-wrap gap-1.5">{REQUIREMENTS.map((r) => <Req key={r} done>{r}</Req>)}</div>
        <div className="mt-auto flex items-center justify-between text-xs font-medium"><span>Your rating</span><Stars /></div>
      </>
    ),
    student: (
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <span className="min-w-0"><span className="block truncate text-sm font-medium">{PROJECT}</span><span className="text-xs text-muted-foreground">Submitted · 2 files</span></span>
        <Pill tone="blue"><Eye className="size-3" />Being verified</Pill>
      </div>
    ) },
  { title: "Approve & sign", actor: "company", handoff: "Company signed off and released €600", color: C.green,
    company: (
      <>
        <Field label="Short review" value="Clear model, delivered on time. We used it the next week." />
        <Btn><Check className="size-4" strokeWidth={3} />Approve, sign & release €600</Btn>
      </>
    ),
    student: (
      <div className="demo-ok-row rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3">
        <span className="block truncate text-sm font-semibold">{PROJECT}</span>
        <div className="mt-2 flex items-center justify-between"><Ok>Verified by the client</Ok><Stars /></div>
      </div>
    ) },
  { title: "Paid", actor: "student", handoff: "€600 paid out to the student", flow: "down", color: C.green,
    company: (
      <>
        <div className="demo-ok-row flex items-center justify-between gap-3 rounded-lg border border-[#86efac] bg-[#f0fdf4] p-3">
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{PROJECT}</span><span className="text-xs text-[#166534]">Complete · rated 5/5</span></span>
          <Ok>Payment released</Ok>
        </div>
        <p className="text-xs text-muted-foreground">Signed credential added to Student A&apos;s profile.</p>
      </>
    ),
    student: (
      <div className="demo-finale flex flex-1 flex-col items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-[#dcfce7] to-[#f0fdf4] text-center">
        <span className="demo-ok grid size-9 place-items-center rounded-full bg-[#22c55e] text-white"><Check className="size-5" strokeWidth={3} /></span>
        <span className="demo-pop tabular-nums text-2xl font-semibold text-[#166534]"><span className="demo-count" aria-hidden /><span className="sr-only">+€600</span></span>
        <span className="text-xs text-[#166534]">Paid to you · credential on your profile</span>
      </div>
    ) },
];

// The steps grouped into the three parts of a project; scrolling moves between these.
const CHAPTERS = [
  { title: "Getting the job", start: 0, end: 4 },
  { title: "Working", start: 4, end: 8 },
  { title: "Getting rewarded", start: 8, end: STEPS.length },
];
const chapterOf = (step: number) => CHAPTERS.findIndex((c) => step < c.end);

// Every step shows for the same time.
const STEP_MS = 4000;

export function WorkflowDemo() {
  const [step, setStep] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLDivElement>(null);
  // The window the visitor is scrolling by hand; the other one mirrors it pixel for pixel. null otherwise.
  const driver = useRef<Side | null>(null);
  const current = STEPS[step];
  const chapter = chapterOf(step);
  const down = (current.flow ?? (current.actor === "company" ? "down" : "up")) === "down";

  // Always playing. Scrolling or a marker only moves it to another chapter, and it carries on from there.
  useEffect(() => {
    const t = setTimeout(() => {
      // Moving on to the next chapter is autoplay's job again, even if the visitor scrolled earlier.
      if (chapterOf((step + 1) % STEPS.length) !== chapterOf(step)) {
        driver.current = null;
        for (const el of [companyRef.current, studentRef.current]) if (el) el.style.scrollSnapType = "";
      }
      setStep((s) => (s + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [step]);

  // Autoplay and the dots bring both windows to the current chapter (hand scrolling moves them itself).
  useEffect(() => {
    if (driver.current) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    for (const el of [companyRef.current, studentRef.current]) {
      if (!el) continue;
      const top = chapter * el.clientHeight;
      if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior });
    }
  }, [chapter]);

  // The wheel scrolls the demo from anywhere on it (not just over a window's content), then settles on a
  // chapter once the wheel stops. At the first or last chapter it lets the page scroll on, and while the page itself
  // is scrolling the demo never grabs the wheel, so scrolling back up the page doesn't get stuck on it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let pageScrolledAt = 0;
    const onPageScroll = () => { pageScrolledAt = performance.now(); };
    const onWheel = (e: WheelEvent) => {
      const [c, s] = [companyRef.current, studentRef.current];
      if (!c || !s || Math.abs(e.deltaY) < Math.abs(e.deltaX) || performance.now() - pageScrolledAt < 300) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      const max = c.scrollHeight - c.clientHeight;
      if ((dy < 0 && c.scrollTop <= 0) || (dy > 0 && c.scrollTop >= max - 1)) return;
      e.preventDefault();
      driver.current = "company";
      c.style.scrollSnapType = s.style.scrollSnapType = "none";
      c.scrollTop += dy; // its onScroll mirrors the student window and updates the chapter
      clearTimeout(settle);
      settle = setTimeout(() => {
        // Lean towards the way the visitor scrolled: a small nudge is enough to move a chapter, up or down.
        const pos = c.scrollTop / c.clientHeight;
        const to = dy > 0 ? Math.ceil(pos - 0.15) : Math.floor(pos + 0.15);
        c.scrollTo({ top: to * c.clientHeight, behavior: "smooth" });
        settle = setTimeout(() => { c.style.scrollSnapType = s.style.scrollSnapType = ""; }, 500);
      }, 150);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onPageScroll, { passive: true });
    return () => { root.removeEventListener("wheel", onWheel); window.removeEventListener("scroll", onPageScroll); clearTimeout(settle); };
  }, []);

  const scrollerOf = (side: Side) => (side === "company" ? companyRef : studentRef).current;
  const otherOf = (side: Side) => scrollerOf(side === "company" ? "student" : "company");
  // The mirroring window must not snap on its own, or it would fight the one being scrolled.
  const takeOver = (side: Side) => {
    driver.current = side;
    const [el, other] = [scrollerOf(side), otherOf(side)];
    if (el) el.style.scrollSnapType = "";
    if (other) other.style.scrollSnapType = "none";
  };
  const release = () => {
    driver.current = null;
    for (const el of [companyRef.current, studentRef.current]) if (el) el.style.scrollSnapType = "";
  };
  // Landing on a chapter starts it from its first step.
  const open = (i: number) => setStep((s) => (chapterOf(s) === i ? s : CHAPTERS[i].start));
  const jump = (i: number) => { release(); open(i); };
  const follow = (side: Side) => {
    const el = scrollerOf(side);
    if (!el || driver.current !== side) return;
    const other = otherOf(side);
    if (other) other.scrollTop = el.scrollTop;
    open(Math.min(CHAPTERS.length - 1, Math.max(0, Math.round(el.scrollTop / el.clientHeight))));
  };

  return (
    // -m-4 p-4 widens the area that catches the wheel without moving anything.
    <div ref={rootRef} className="-m-4 flex min-w-0 flex-col p-4" style={{ "--c": current.color[0], "--c-fg": current.color[1], "--c-tint": current.color[2] } as React.CSSProperties}>
      <div key={chapter} className="page-enter mb-3 flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-[var(--c)] text-[0.6875rem] font-semibold text-white transition-colors duration-300" aria-label={`Chapter ${chapter + 1} of ${CHAPTERS.length}`}>{chapter + 1}</span>
        <span className="text-sm font-semibold">{CHAPTERS[chapter].title}</span>
      </div>

      <div className="flex gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Fixed heights so the steps never shift the page. */}
          <div className="h-[13.5rem]"><Window side="company" step={step} scrollerRef={companyRef} onScroll={follow} onTakeOver={takeOver} /></div>

          {/* What passes from the acting side to the other one. */}
          <div className="relative flex h-14 items-center justify-center px-2">
            <span className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-[var(--c)] opacity-50 transition-colors duration-300" />
            {[0, 1].map((i) => (
              <span key={`${step}-${i}`} aria-hidden className={cn("absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--c)]", down ? "demo-flow-down" : "demo-flow-up")} style={{ animationDelay: `${i * 0.75}s` }} />
            ))}
            <span key={step} className={cn("relative inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--c)] bg-[var(--c-tint)] py-1.5 pl-1.5 pr-3.5 text-[0.8125rem] font-medium leading-tight text-[var(--c-fg)] shadow-sm", down ? "demo-travel-down" : "demo-travel-up")}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--c)] text-white">{down ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />}</span>
              <span className="min-w-0">{current.handoff}</span>
            </span>
          </div>

          <div className="h-[13.5rem]"><Window side="student" step={step} scrollerRef={studentRef} onScroll={follow} onTakeOver={takeOver} /></div>
        </div>

        {/* Where you are: one marker per chapter. The current one stretches and fills as its steps play. */}
        <ol className="flex flex-col items-center justify-center gap-2.5" aria-label="Chapters">
          {CHAPTERS.map((c, i) => {
            const fill = i < chapter ? 1 : i > chapter ? 0 : (step - c.start + 1) / (c.end - c.start);
            const color = STEPS[i === chapter ? step : c.end - 1].color[0];
            return (
              <li key={c.title} className="flex">
                <button onClick={() => jump(i)} aria-label={`Chapter ${i + 1}: ${c.title}`} aria-current={i === chapter ? "step" : undefined} title={c.title}
                  className="group grid w-4 place-items-center py-0.5">
                  <span className={cn("relative block w-2 overflow-hidden rounded-full bg-zinc-300 transition-all duration-300", i === chapter ? "h-12" : "h-2 group-hover:scale-125")}>
                    <span className="absolute inset-x-0 top-0 rounded-full transition-all duration-500" style={{ height: `${fill * 100}%`, background: color, opacity: i < chapter ? 0.5 : 1 }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

    </div>
  );
}
