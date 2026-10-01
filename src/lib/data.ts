// The ONLY file the UI reads data from. Today it serves an in-memory store; in
// Phase 3 each function body becomes a Supabase query and nothing else changes.
import { db } from "./store";
import type { Application, Category, CvInfo, Credential, Project, StudentProfile } from "./types";

export const FEE_RATE = 0.15;

export type ProjectFilter = { q?: string; skill?: string; category?: string };

export async function getOpenProjects(f: ProjectFilter = {}): Promise<Project[]> {
  const q = f.q?.trim().toLowerCase();
  return db.projects.filter(
    (p) =>
      p.status === "open" &&
      (!f.category || p.category === f.category) &&
      (!f.skill || p.skills.includes(f.skill)) &&
      (!q || `${p.title} ${p.summary} ${p.orgName ?? ""} ${p.category} ${p.skills.join(" ")}`.toLowerCase().includes(q)),
  );
}

export async function getAllSkills(): Promise<string[]> {
  return [...new Set(db.projects.filter((p) => p.status === "open").flatMap((p) => p.skills))].sort();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.find((p) => p.id === id);
}

export async function getApplicationFor(user: StudentProfile, projectId: string): Promise<Application | undefined> {
  return db.applications.find((a) => a.projectId === projectId && a.studentId === user.id);
}

export async function getApplications(user: StudentProfile): Promise<(Application & { project: Project })[]> {
  return db.applications.flatMap((a) => {
    const project = db.projects.find((p) => p.id === a.projectId);
    return a.studentId === user.id && project ? [{ ...a, project }] : [];
  });
}

export async function getProjectsPostedBy(user: StudentProfile): Promise<Project[]> {
  return db.projects.filter((p) => p.postedById === user.id);
}

export async function createApplication(user: StudentProfile, projectId: string, pitch: string): Promise<{ error?: string }> {
  const project = db.projects.find((p) => p.id === projectId);
  if (!project || project.status !== "open") return { error: "This project is no longer open." };
  if (project.postedById === user.id) return { error: "You can't apply to your own project." };
  if (db.applications.some((a) => a.projectId === projectId && a.studentId === user.id)) return { error: "You already applied." };
  if (pitch.trim().length < 20) return { error: "Write at least a couple of sentences." };
  db.applications.push({ id: `a${Date.now()}`, studentId: user.id, projectId, pitch: pitch.trim(), status: "pending" });
  project.applicantCount += 1;
  return {};
}

export type NewProject = Pick<Project, "title" | "category" | "summary" | "deliverables" | "doneWhen" | "priceEur" | "weeks" | "skills">;

export async function createProject(user: StudentProfile, input: NewProject): Promise<Project> {
  const project: Project = {
    ...input, id: `p${Date.now()}`, postedById: user.id, clientName: user.fullName, clientKind: "student",
    orgName: null, orgVerified: false, hood: "IE community", status: "open", applicantCount: 0,
  };
  db.projects.unshift(project);
  return project;
}

export async function getCredentials(user: StudentProfile): Promise<Credential[]> {
  return db.credentials.filter((c) => c.studentId === user.id);
}

export async function createUser(u: Pick<StudentProfile, "email" | "fullName" | "program">): Promise<StudentProfile | { error: string }> {
  const id = u.email.toLowerCase();
  if (db.users.has(id)) return { error: "An account with this email already exists. Sign in instead." };
  const user: StudentProfile = {
    id, email: id, fullName: u.fullName, program: u.program,
    uniEmailVerified: /@(student\.)?ie\.edu$/.test(id),
    githubHandle: null, linkedinUrl: null, cv: null,
  };
  db.users.set(id, user);
  return user;
}

export async function findUserByEmail(email: string): Promise<StudentProfile | undefined> {
  return db.users.get(email.toLowerCase());
}

export async function updateProfile(
  user: StudentProfile,
  patch: Partial<Pick<StudentProfile, "fullName" | "program" | "githubHandle" | "linkedinUrl">>,
) {
  Object.assign(db.users.get(user.id)!, patch);
}

export async function setCv(user: StudentProfile, cv: CvInfo) {
  db.users.get(user.id)!.cv = cv;
}

export type { Category };
