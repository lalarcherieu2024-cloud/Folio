import { redirect } from "next/navigation";

// Companies sign in on the shared sign-in page; keep this URL working for old links.
export default async function CompanySignIn({ searchParams }: PageProps<"/company/signin">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? `&next=${encodeURIComponent(sp.next)}` : "";
  redirect(`/signin?as=company${next}`);
}
