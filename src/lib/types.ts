// Shapes mirror the tables in supabase/migrations/. When you wire Supabase,
// replace these with `supabase gen types typescript`.

export const CATEGORIES = [
  "Tech & Data",
  "Design & Creative",
  "Marketing & Growth",
  "Business & Finance",
  "Research & Analysis",
  "Writing & Content",
  "Video & Photo",
  "Operations & Admin",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type ProjectStatus = "open" | "in_progress" | "delivered" | "verified" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "declined";

export type Project = {
  id: string;
  postedById: string | null; // user id of a student client; null for seeded company projects
  clientName: string;
  clientKind: "company" | "student";
  orgName: string | null; // null when a student is the client
  orgVerified: boolean;
  hood: string;
  category: Category;
  title: string;
  summary: string;
  deliverables: string[];
  doneWhen: string;
  priceEur: number;
  weeks: number;
  skills: string[];
  status: ProjectStatus;
  applicantCount: number;
};

export type Application = {
  id: string;
  projectId: string;
  pitch: string;
  status: ApplicationStatus;
};

export type Credential = {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  orgName: string | null;
  hood: string;
  rating: number;
  review: string;
  issuedAt: string; // e.g. "July 2026"
};

export type CvInfo = { fileName: string; sizeKb: number; uploadedAt: string };

export type StudentProfile = {
  id: string; // = email in demo mode; = auth.users.id with Supabase
  email: string;
  fullName: string;
  program: string;
  uniEmailVerified: boolean;
  githubHandle: string | null; // optional, entered but NOT yet verified
  linkedinUrl: string | null; // optional, entered but NOT yet verified
  cv: CvInfo | null;
};
