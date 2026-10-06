import { CompanyVerify } from "@/components/startup/CompanyVerify";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";
import { detailsComplete } from "@/lib/org";

export const metadata = { title: "Company verification · Folio" };

// STARTUP INTERFACE (owner: startup builder). Verification stage 1, after the account and email exist.
export default async function VerifyCompany({ searchParams }: PageProps<"/company/verify">) {
  const user = await requireUser("/company/verify", "company");
  const org = await getOrganization(user);
  const asked = Number((await searchParams).step);

  // Submitted or verified companies only see their status. Before that: details (3), then review and submit (5).
  // The old documents step (4) is gone: documents are asked for before the first payment (migration 0030).
  let step: 3 | 5 | 6;
  if (org && (org.status === "pending" || org.status === "verified")) step = 6;
  else if (!org || !detailsComplete(org)) step = 3; // also a draft saved part-way with "Finish later"
  else if (asked === 3) step = 3;
  else if (org.status === "rejected" && asked !== 5) step = 6;
  else step = 5;

  return <CompanyVerify step={step} org={org} user={user} />;
}
