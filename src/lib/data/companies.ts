// The public page of a verified company (/companies/<id>), readable by anyone, signed in or not.
// Read with the service role because visitors can't read organizations directly; only what is shown
// on the page leaves this function.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { avatarPublicUrl } from "../avatar";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";
import type { Credential, Project } from "../types";
import { monthYear, toProject, UUID } from "./shared";

export type PublicCompany = {
  id: string; name: string; hood: string; about: string; website: string; linkedinUrl: string;
  founded: string; teamSize: string; logoUrl: string | null; logoColor: string | null; founderLinkedinVerified: boolean;
  studentStartup: boolean; // an IE student's own startup, not registered yet (migration 0031)
  openProjects: Project[];
  completed: number;
  certificatesIssued: number;
  avgRatingGiven: number | null;
  recentCertificates: (Credential & { student: string })[];
};

export async function getPublicCompany(id: string): Promise<PublicCompany | null> {
  if (!UUID.test(id)) return null;
  const admin = createAdminClient();
  const { data: o } = await admin.from("organizations").select("*").eq("id", id).maybeSingle();
  if (!o || !(o.status === "verified" || o.verified)) return null; // only verified companies have a public page

  // project_cards only shows the public open projects to visitors, so counts come from the projects table itself.
  const [{ data: founder }, { data: cards }, { data: all }] = await Promise.all([
    o.owner_id ? admin.from("profiles").select("linkedin_verified").eq("id", o.owner_id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("project_cards").select("*").eq("org_id", id).eq("status", "open"),
    admin.from("projects").select("id, status").eq("org_id", id),
  ]);
  const open = (cards ?? []).map((r: any) => ({ ...toProject(r), createdAt: r.created_at as string }));
  const ids = (all ?? []).map((p: any) => p.id as string);
  const { data: creds } = ids.length ? await admin.from("credential_cards").select("*").in("project_id", ids).order("issued_at", { ascending: false }) : { data: [] as any[] };
  const recent = (creds ?? []).slice(0, 3);
  const { data: people } = recent.length ? await admin.from("profiles").select("id, full_name").in("id", recent.map((c: any) => c.student_id)) : { data: [] as any[] };
  const ratings = (creds ?? []).map((c: any) => c.rating as number);

  return {
    id: o.id, name: o.name ?? "", hood: o.hood ?? "", about: o.blurb ?? "", website: o.website ?? "", linkedinUrl: o.linkedin_url ?? "",
    founded: o.founded ?? "", teamSize: o.size ?? "", logoUrl: avatarPublicUrl(o.logo_path), logoColor: o.logo_color ?? null,
    founderLinkedinVerified: !!founder?.linkedin_verified,
    studentStartup: o.kind === "student_startup",
    openProjects: open.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    completed: (all ?? []).filter((p: any) => p.status === "verified").length,
    certificatesIssued: (creds ?? []).length,
    avgRatingGiven: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    recentCertificates: recent.map((r: any) => ({
      id: r.id, projectId: r.project_id, projectTitle: r.project_title, clientName: r.client_name, orgName: r.org_name, hood: r.hood,
      rating: r.rating, review: r.review, issuedAt: monthYear(r.issued_at), category: r.category ?? "", priceEur: r.price_eur ?? 0,
      student: (people ?? []).find((p: any) => p.id === r.student_id)?.full_name ?? "A Folio student",
    })),
  };
}

/** Whether the company behind a project is an IE student's own startup (migration 0031), so students know who they'd
 *  work for. False before the migration, and for projects without a company. */
export async function isStudentStartup(orgId: string | null): Promise<boolean> {
  if (!orgId || !UUID.test(orgId)) return false;
  // The visitor's own client (organizations are readable, 0001), so it works without the service-role key too.
  const { data } = await (await createClient()).from("organizations").select("*").eq("id", orgId).maybeSingle();
  return data?.kind === "student_startup";
}
