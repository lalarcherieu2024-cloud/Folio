import { CompanyVerify } from "@/components/startup/CompanyVerify";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";

export const metadata = { title: "Company verification · Folio" };

// STARTUP INTERFACE (owner: startup builder). Verification stage 1, after the account and email exist.
export default async function VerifyCompany({ searchParams }: PageProps<"/company/verify">) {
  const user = await requireUser("/company/verify", "company");
  const org = await getOrganization(user);
  const sp = await searchParams;

  // One step (migration 0032): the details form, which sends them for review, then the status. A company that was asked
  // for changes sees the status with the note, and "Fix and resubmit" (?edit=1) reopens the form.
  const step: 1 | 2 = !org || org.status === "draft" || (org.status === "rejected" && (sp.edit === "1" || sp.step !== undefined)) ? 1 : 2;

  // "?founder=1" comes from the student-founder sign-up: the details step starts on "Student startup".
  return <CompanyVerify step={step} org={org} user={user} founder={sp.founder === "1"} />;
}
