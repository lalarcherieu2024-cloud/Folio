// The company's side of a project's life, drawn with the same tracker, colours and badges as the student's
// "My work": Created -> Paid (live for students) -> Hired -> Submitted -> Verified.
import type { Applicant, CompanyProject } from "./data/startup";
import { dueInfo, TONE_CLASS, type Tone } from "./work";

export const COMPANY_STEPS = ["Created", "Paid", "Hired", "Submitted", "Verified"];

export type CompanyStageKey = "draft" | "open" | "building" | "submitted" | "verified" | "cancelled";
export type CompanyStage = { key: CompanyStageKey; step: number; label: string; tone: Tone; colors: [string, string, string] };

// A restrained palette for companies (the student side is more colourful): slate and navy for normal progress,
// amber only where the company has to act, green when it's done. [ring, text, row tint]
const PRO: Record<CompanyStageKey, [string, string, string]> = {
  draft: ["#94a3b8", "#475569", "#ffffff"],
  open: ["#64748b", "#334155", "#ffffff"],
  building: ["#0c4a6e", "#0c4a6e", "#ffffff"],
  submitted: ["#b45309", "#92400e", "#fffbf5"],
  verified: ["#15803d", "#166534", "#ffffff"],
  cancelled: ["#cbd5e1", "#64748b", "#ffffff"],
};
const LOOK: Record<CompanyStageKey, [step: number, label: string, tone: Tone]> = {
  draft: [0, "Awaiting payment", "warning"],
  open: [1, "Finding a student", "muted"],
  building: [2, "In progress", "info"],
  submitted: [3, "Review the work", "warning"],
  verified: [4, "Verified", "success"],
  cancelled: [-1, "Cancelled", "muted"],
};

/** Where a project stands for the company, from its status and the student it hired (if any). */
export function companyStage(p: Pick<CompanyProject, "status">, hired: Pick<Applicant, "status"> | null): CompanyStage {
  const key: CompanyStageKey =
    p.status === "draft" ? "draft"
    : p.status === "cancelled" ? "cancelled"
    : p.status === "verified" ? "verified"
    : hired?.status === "delivered" || p.status === "delivered" ? "submitted"
    : hired ? "building"
    : "open";
  const [step, label, tone] = LOOK[key];
  return { key, step, label, tone, colors: PRO[key] };
}

export const companyStagePct = (s: CompanyStage) => (s.step < 0 ? 0 : Math.round(((s.step + 1) / COMPANY_STEPS.length) * 100));
export const toneClass = (t: Tone) => TONE_CLASS[t];

/** One project as the company follows it: the student it hired, who is waiting, and the hand-in date. */
export type BoardRow = {
  project: CompanyProject;
  stage: CompanyStage;
  hired: Applicant | null;
  waiting: number;       // applicants still to decide on (pending or interview)
  due: ReturnType<typeof dueInfo>;
};

export function boardRows(projects: CompanyProject[], applicants: Applicant[]): BoardRow[] {
  return projects.map((project) => {
    const mine = applicants.filter((a) => a.projectId === project.id);
    const hired = mine.find((a) => a.status === "accepted" || a.status === "delivered") ?? null;
    const stage = companyStage(project, hired);
    return {
      project, stage, hired,
      waiting: mine.filter((a) => a.status === "pending" || a.status === "interview").length,
      due: stage.key === "building" && hired ? dueInfo(hired.acceptedAt, project.weeks) : null,
    };
  });
}

/** The next thing the company has to do on this project, in plain words. */
export function nextStep(r: BoardRow, withDue = true): string {
  switch (r.stage.key) {
    case "draft": return "One step left: pay to publish, and students can start applying.";
    case "open": return r.waiting ? `${r.waiting} applicant${r.waiting === 1 ? " is" : "s are"} waiting to hear from you.` : "Live for students. New applications will show up here.";
    case "building": return r.due && withDue ? `${r.hired?.name ?? "Your student"} is working on it · ${r.due.label}` : `${r.hired?.name ?? "Your student"} is working on it.`;
    case "submitted": return `${r.hired?.name ?? "Your student"} delivered the work. Take a look, then approve it or share feedback.`;
    case "verified": return "Done and verified. The student's certificate is issued.";
    default: return "Cancelled.";
  }
}
