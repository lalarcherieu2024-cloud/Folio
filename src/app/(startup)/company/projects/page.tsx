import { CompanyWorkTabs } from "@/components/startup/CompanyWorkTabs";
import { PageHeader } from "@/components/startup/ui";
import { requireUser } from "@/lib/auth";
import { boardRows } from "@/lib/company-work";
import { getCompanyApplicants, getCompanyProjects, getProjectDrafts } from "@/lib/data/startup";

export const metadata = { title: "My projects · Folio" };

// STARTUP INTERFACE. Every project with its tracker, like the student's "My work".
export default async function CompanyProjects({ searchParams }: PageProps<"/company/projects">) {
  const sp = await searchParams;
  const user = await requireUser("/company/projects", "company");
  const projects = await getCompanyProjects(user);
  const [applicants, unfinished] = await Promise.all([getCompanyApplicants(projects), getProjectDrafts(user)]);
  const rows = boardRows(projects, applicants);
  const tab = sp.tab === "drafts" ? "drafts" : sp.tab === "past" ? "past" : "active";
  return (
    <div className="page-enter flex flex-col gap-6">
      <PageHeader title="My projects" sub="Track each project from posting to verified work." />
      <CompanyWorkTabs rows={rows} unfinished={unfinished} tab={tab} />
    </div>
  );
}
