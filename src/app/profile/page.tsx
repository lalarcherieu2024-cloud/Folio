import Link from "next/link";
import { CvForm, DetailsForm } from "@/components/ProfileForms";
import { Plaque } from "@/components/Plaque";
import { requireUser } from "@/lib/auth";
import { getCredentials } from "@/lib/data";

export const metadata = { title: "My profile · Folio" };

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const sp = await searchParams;
  const me = await requireUser("/profile");
  const creds = await getCredentials(me);
  const badge = (on: boolean, yes: string, no: string) => (
    <span className={`rounded-full px-2.5 py-0.5 text-[.78rem] font-bold ${on ? "bg-green-soft text-green" : "border border-line bg-bg text-muted"}`}>{on ? yes : no}</span>
  );
  return (
    <>
      {sp.welcome && (
        <div className="mb-6 rounded-xl border-2 border-blue bg-blue-soft p-5">
          <h2 className="text-xl">Welcome to Folio, {me.fullName.split(" ")[0]}!</h2>
          <p className="mt-1 text-muted">Add your CV below (GitHub and LinkedIn are optional), then <Link href="/projects" className="font-bold text-blue underline">find your first project</Link>.</p>
        </div>
      )}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-blue-soft text-xl font-extrabold text-blue">{me.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
        <div>
          <h1 className="text-3xl">{me.fullName}</h1>
          <p className="text-muted">{me.program || "Add your programme"} · {creds.length} verified project{creds.length === 1 ? "" : "s"}</p>
          <p className="mt-2 flex flex-wrap gap-2">
            {badge(me.uniEmailVerified, "✓ University email", "University email not verified")}
            {badge(!!me.cv, "✓ CV uploaded", "No CV yet")}
            {me.githubHandle && badge(false, "", `GitHub @${me.githubHandle} (unverified)`)}
            {me.linkedinUrl && badge(false, "", "LinkedIn added (unverified)")}
          </p>
        </div>
      </div>

      <div className="mb-12 grid gap-5 md:grid-cols-2">
        <CvForm cv={me.cv} />
        <DetailsForm user={me} />
      </div>

      <h2 className="mb-4 text-2xl">My verified record</h2>
      {creds.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">{creds.map((c) => <Plaque key={c.id} c={c} />)}</div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-line p-8 text-center text-muted">
          Finished projects appear here once the client verifies them.<br />
          <Link href="/projects" className="btn mt-3">Find a project</Link>
        </div>
      )}
    </>
  );
}
