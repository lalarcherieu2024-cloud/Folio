// Helpers shared by every data module. Not tied to one side of the product.
import { avatarPublicUrl } from "../avatar";
import type { Application, Interview, Project } from "../types";

export const FEE_RATE = 0.15;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toProject = (r: any): Project => ({
  id: r.id, postedById: r.client_id, clientName: r.client_name, clientKind: r.org_id ? "company" : "student",
  orgName: r.org_name, orgVerified: r.org_verified, orgLogoUrl: avatarPublicUrl(r.org_logo_path), clientAvatarUrl: avatarPublicUrl(r.client_avatar_path), hood: r.hood, category: r.category, title: r.title,
  summary: r.summary, deliverables: r.deliverables, doneWhen: r.done_when, priceEur: r.price_eur,
  weeks: r.weeks, skills: r.skills, status: r.status, applicantCount: r.applicant_count,
  hoursPerWeek: r.hours_per_week ?? null, learn: r.learn ?? [], beginnerFriendly: !!r.beginner_friendly,
  about: r.org_blurb ? { industry: r.org_industry ?? "", size: r.org_size ?? "", founded: r.org_founded ?? "", blurb: r.org_blurb, website: r.org_website } : null,
});
export const toInterview = (r: any): Interview | null =>
  r.interview_at ? { at: r.interview_at, where: r.interview_where ?? "", note: r.interview_note ?? null, confirmedAt: r.interview_confirmed_at ?? null } : null;
export const toApplication = (r: any): Application => ({ id: r.id, projectId: r.project_id, pitch: r.pitch, status: r.status, createdAt: r.created_at, includeFiles: !!r.include_files, acceptedAt: r.accepted_at ?? null, interview: toInterview(r) });
export const monthYear = (iso: string) => new Date(iso).toLocaleString("en-GB", { month: "long", year: "numeric" });
