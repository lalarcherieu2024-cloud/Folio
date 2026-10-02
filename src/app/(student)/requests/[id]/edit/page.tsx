import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditRequestForm } from "@/components/student/EditRequestForm";
import { requireUser } from "@/lib/auth";
import { getApplicants, getOwnedProject } from "@/lib/data/applicants";

export const metadata = { title: "Edit request · Folio" };

export default async function EditRequestPage(props: PageProps<"/requests/[id]/edit">) {
  const { id } = await props.params;
  const user = await requireUser(`/requests/${id}/edit`, "student");
  const project = await getOwnedProject(user, id);
  if (!project) notFound();
  // Once someone is accepted the request is locked for everyone.
  if (project.status !== "open") redirect(`/requests/${id}`);
  const applicants = await getApplicants(project);
  return (
    <div className="page-enter flex flex-col gap-6">
      <Link href={`/requests/${id}`} className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Back to request</Link>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.875rem] font-semibold tracking-[-0.025em]">Edit request</h1>
        <p className="max-w-[62ch] text-[0.9375rem] text-muted-foreground">You can change this until you accept someone. Anyone who has applied gets a notification when it changes.</p>
      </div>
      <EditRequestForm project={project} applicants={applicants.filter((a) => a.status === "pending").length} />
    </div>
  );
}
