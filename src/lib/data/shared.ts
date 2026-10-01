// Helpers shared by every data module. Not tied to one side of the product.
import type { Application, Project } from "../types";

export const FEE_RATE = 0.15;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toProject = (r: any): Project => ({
  id: r.id, postedById: r.client_id, clientName: r.client_name, clientKind: r.org_id ? "company" : "student",
  orgName: r.org_name, orgVerified: r.org_verified, hood: r.hood, category: r.category, title: r.title,
  summary: r.summary, deliverables: r.deliverables, doneWhen: r.done_when, priceEur: r.price_eur,
  weeks: r.weeks, skills: r.skills, status: r.status, applicantCount: r.applicant_count,
});
export const toApplication = (r: any): Application => ({ id: r.id, projectId: r.project_id, pitch: r.pitch, status: r.status, createdAt: r.created_at });
export const monthYear = (iso: string) => new Date(iso).toLocaleString("en-GB", { month: "long", year: "numeric" });
