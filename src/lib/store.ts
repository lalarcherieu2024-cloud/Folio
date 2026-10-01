// In-memory demo database. Pinned to globalThis so it survives dev hot reloads.
// DELETE THIS FILE in Phase 3 when data.ts moves to Supabase.
import { DEMO_USER, seedApplications, seedCredentials, seedProjects } from "./mock-data";
import type { Application, Credential, Project, StudentProfile } from "./types";

type Db = {
  users: Map<string, StudentProfile>;
  projects: Project[];
  applications: (Application & { studentId: string })[];
  credentials: (Credential & { studentId: string })[];
};

const g = globalThis as unknown as { __folioDb?: Db };

export const db: Db = (g.__folioDb ??= {
  users: new Map([[DEMO_USER.id, { ...DEMO_USER }]]),
  projects: seedProjects.map((p) => ({ ...p })),
  applications: [...seedApplications],
  credentials: [...seedCredentials],
});
