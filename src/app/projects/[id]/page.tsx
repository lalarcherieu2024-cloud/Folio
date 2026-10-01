import { redirect } from "next/navigation";

// Old direct links open the project sheet on the browse page.
export default async function ProjectRedirect(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  redirect(`/projects?project=${id}`);
}
