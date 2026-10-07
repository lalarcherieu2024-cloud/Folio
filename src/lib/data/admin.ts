// The admin page (/admin): every company and where it stands in verification. Read with the service role, because
// it spans all accounts; only requireAdmin() pages and actions call it.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { avatarPublicUrl } from "../avatar";
import { createAdminClient } from "../supabase/admin";
import type { OrgKind, OrgStatus } from "./startup";

export type ReviewCompany = {
  id: string; kind: OrgKind; status: OrgStatus; name: string; cif: string; website: string; hood: string; about: string;
  logoUrl: string | null; logoColor: string | null; reviewNote: string | null;
  createdAt: string | null; submittedAt: string | null; verifiedAt: string | null;
  owner: { name: string; email: string; linkedinUrl: string | null; linkedinVerified: boolean };
  founderIeEmail: string | null; // student startups (migration 0031)
  docs: { kind: string; fileName: string; url: string | null }[];
};

export type ReviewData = { companies: ReviewCompany[]; withoutDetails: number };

export async function getReviewData(): Promise<ReviewData> {
  const admin = createAdminClient();
  const [{ data: orgs }, { data: companyAccounts }, { data: users }] = await Promise.all([
    admin.from("organizations").select("*").not("owner_id", "is", null),
    admin.from("profiles").select("id, full_name, linkedin_url, linkedin_verified").eq("role", "company"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const ids = (orgs ?? []).map((o: any) => o.id);
  const [{ data: founders }, { data: docs }] = await Promise.all([
    ids.length ? admin.from("startup_founders").select("org_id, ie_email").in("org_id", ids) : Promise.resolve({ data: [] as any[] }), // none before 0031
    ids.length ? admin.from("company_documents").select("org_id, kind, path, file_name").in("org_id", ids) : Promise.resolve({ data: [] as any[] }),
  ]);
  const signed = docs?.length ? (await admin.storage.from("company-docs").createSignedUrls(docs.map((d: any) => d.path), 600)).data : null;
  const emails = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const people = new Map((companyAccounts ?? []).map((p: any) => [p.id, p]));

  const companies = (orgs ?? []).map((o: any): ReviewCompany => {
    const p = people.get(o.owner_id);
    return {
      id: o.id, kind: o.kind === "student_startup" ? "student_startup" : "company", status: (o.status as OrgStatus) ?? "draft",
      name: o.name ?? "", cif: o.cif ?? "", website: o.website ?? "", hood: o.hood ?? "", about: o.blurb ?? "",
      logoUrl: avatarPublicUrl(o.logo_path), logoColor: o.logo_color ?? null, reviewNote: o.review_note ?? null,
      createdAt: o.created_at ?? null, submittedAt: o.submitted_at ?? null, verifiedAt: o.verified_at ?? null,
      owner: { name: p?.full_name ?? "", email: emails.get(o.owner_id) ?? "", linkedinUrl: p?.linkedin_url ?? null, linkedinVerified: !!p?.linkedin_verified },
      founderIeEmail: (founders ?? []).find((f: any) => f.org_id === o.id)?.ie_email ?? null,
      docs: (docs ?? []).filter((d: any) => d.org_id === o.id).map((d: any) => ({ kind: d.kind, fileName: d.file_name, url: signed?.find((x: any) => x.path === d.path)?.signedUrl ?? null })),
    };
  });
  const withOrg = new Set((orgs ?? []).map((o: any) => o.owner_id));
  return { companies, withoutDetails: (companyAccounts ?? []).filter((p: any) => !withOrg.has(p.id)).length };
}

/** Approve or ask for changes, and tell the company (the same updates as approve_company() / reject_company()). */
export async function decideCompany(orgId: string, approve: boolean, note: string): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id, owner_id, status").eq("id", orgId).maybeSingle();
  if (!org) return { error: "Company not found." };
  const { error } = await admin.from("organizations").update(approve
    ? { status: "verified", verified: true, verified_at: new Date().toISOString(), review_note: null }
    : { status: "rejected", verified: false, review_note: note }).eq("id", orgId);
  if (error) { console.error("decideCompany", error); return { error: "Couldn't save the decision. Try again." }; }
  if (org.owner_id) {
    await admin.from("notifications").insert(approve
      ? { user_id: org.owner_id, kind: "company_verified", title: "Your company is verified", body: "You can now publish projects.", link: "/company" }
      : { user_id: org.owner_id, kind: "company_changes", title: "Folio needs a change to verify your company", body: note.slice(0, 120), link: "/company/verify" });
  }
  return {};
}
