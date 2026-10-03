import { redirect } from "next/navigation";
import { CompanyDetailsForm } from "@/components/startup/CompanyDetailsForm";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";

export const metadata = { title: "Edit company profile · Folio" };

// STARTUP INTERFACE (owner: startup builder).
export default async function EditCompanyProfile() {
  const user = await requireUser("/company/profile/edit", "company");
  const org = await getOrganization(user);
  if (!org) redirect("/company/verify");
  return (
    <div className="page-enter flex max-w-[620px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em]">Edit profile</h1>
        <p className="text-[15px] text-muted-foreground">Students see this on your profile and next to every project you post.</p>
      </div>
      <CompanyDetailsForm org={org} then="profile" backHref="/company/profile" backLabel="Cancel" submitLabel="Save" />
    </div>
  );
}
