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

export type Role = "student" | "company";

export type ProjectStatus = "draft" | "open" | "in_progress" | "delivered" | "verified" | "cancelled";
export type ApplicationStatus = "pending" | "interview" | "accepted" | "declined" | "delivered";

/** An interview the client set up (migration 0017). `where` is a meeting link or an address. */
export type Interview = { at: string; where: string; note: string | null; confirmedAt: string | null };

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
  about: CompanyAbout | null; // null for student requests, or until a company fills it in
  hoursPerWeek: number | null; // typical weekly effort
  learn: string[]; // what a student picks up doing it
  beginnerFriendly: boolean; // a good first project
};

export type CompanyAbout = { industry: string; size: string; founded: string; blurb: string; website: string | null };

export type Application = {
  id: string;
  projectId: string;
  pitch: string; // optional note, may be empty
  status: ApplicationStatus;
  createdAt: string;
  includeFiles: boolean; // student chose to share their additional files
  acceptedAt: string | null; // when the client chose this student (starts the clock)
  interview: Interview | null; // set once the client invites the student to an interview
};

export type Applicant = {
  applicationId: string;
  status: ApplicationStatus;
  pitch: string;
  includeFiles: boolean;
  appliedAt: string;
  student: { id: string; avatarColor: string | null; avatarUrl: string | null; fullName: string; program: string; githubHandle: string | null; githubVerified: boolean; linkedinUrl: string | null; linkedinVerified: boolean; topField: string | null };
  cv: { name: string; sizeKb: number; url: string | null } | null;
  files: { id: string; name: string; sizeKb: number; url: string | null }[];
  matchedSkills: string[]; // skills the project asks for that this student has
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
  category: string; // field of the project
  priceEur: number;
};

export type ProfileFile = { id: string; name: string; sizeKb: number; createdAt: string };

export type Notification = { id: string; kind: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export type CvInfo = { fileName: string; sizeKb: number; uploadedAt: string };

export type Strengths = {
  fields: { label: string; pct: number }[];
  skills: { label: string; pct: number }[];
};

export type StudentProfile = {
  id: string; // auth.users.id
  role: Role;
  email: string;
  fullName: string;
  program: string;
  uniEmailVerified: boolean;
  githubHandle: string | null; // typed by the student, or the real handle once verified
  linkedinUrl: string | null; // optional, typed by the student
  githubVerified: boolean; // true only after linking the real GitHub account (OAuth)
  linkedinVerified: boolean; // true only after linking the real LinkedIn account (OAuth)
  cv: CvInfo | null;
  strengths: Strengths | null;
  avatarColor: string | null; // chosen background colour for the initials
  avatarUrl: string | null; // uploaded photo, if any
  payoutLink: string | null; // PayPal link where the student gets paid
  fileCount: number; // additional files (portfolio etc.)
};
