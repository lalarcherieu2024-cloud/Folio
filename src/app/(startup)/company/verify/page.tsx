import { CompanyVerify } from "@/components/startup/CompanyVerify";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";
import { detailsComplete } from "@/lib/org";

export const metadata = { title: "Company verification · Folio" };

// STARTUP INTERFACE (owner: startup builder). Sign-up steps 3–6, after the account and email exist.
export default async function VerifyCompany({ searchParams }: PageProps<"/company/verify">) {
  const user = await requireUser("/company/verify", "company");
  const org = await getOrganization(user);
  const asked = Number((await searchParams).step);
  const docsDone = org?.docs.length === 3 && !!org.logoUrl; // three documents and a logo (required for brand recognition)

  // Submitted or verified companies only see their status; drafts move through 3 → 4 → 5.
  let step: 3 | 4 | 5 | 6;
  if (org && (org.status === "pending" || org.status === "verified")) step = 6;
  else if (!org || !detailsComplete(org)) step = 3; // also a draft saved part-way with "Finish later"
  else if (asked === 3 || asked === 4) step = asked;
  else if (asked === 5) step = docsDone ? 5 : 4;
  else step = org.status === "rejected" ? 6 : docsDone ? 5 : 4;

  return <CompanyVerify step={step} org={org} email={user.email} name={user.fullName} />;
}
