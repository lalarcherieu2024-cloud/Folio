import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyDetailsForm } from "@/components/startup/CompanyDetailsForm";
import { PageHeader } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { getOrganization } from "@/lib/data/startup";

export const metadata = { title: "Edit company profile · Folio" };

// STARTUP INTERFACE (owner: startup builder).
export default async function EditCompanyProfile() {
  const user = await requireUser("/company/profile/edit", "company");
  const org = await getOrganization(user);
  if (!org) redirect("/company/verify");
  return (
    <div className="page-enter flex max-w-[38.75rem] flex-col gap-6">
      <Link href="/company/profile" className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Company profile</Link>
      <PageHeader title="Edit profile" sub="Students see this on your profile and next to every project you post." />
      <CompanyDetailsForm org={org} then="profile" backHref="/company/profile" backLabel="Cancel" submitLabel="Save" />
    </div>
  );
}
