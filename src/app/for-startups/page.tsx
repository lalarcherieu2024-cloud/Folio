import Link from "next/link";

export const metadata = { title: "For startups and SMEs · Folio" };

export default function ForStartups() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-3 inline-block rounded-full bg-amber-soft px-3 py-1 text-sm font-bold text-amber-ink">Coming next</p>
      <h1 className="text-4xl">Folio for startups and small businesses</h1>
      <p className="my-5 text-lg text-muted">Post a small, fixed-price project, get a clear AI-written brief, pick a verified student and pay only when you confirm delivery. Marketing, design, data, research, video: any field.</p>
      <ul className="mb-8 list-disc space-y-2 pl-5 text-muted">
        <li>Companies are verified with a company email, LinkedIn and Spanish tax ID (CIF), so students know you are real.</li>
        <li>A signed review from you becomes a verified credential on the student&apos;s record.</li>
        <li>A trial run for future hires: a great project can turn into an offer.</li>
      </ul>
      <p className="mb-6 rounded-lg border border-line bg-surface p-4">We are launching the student side first. The company dashboard is the next phase.</p>
      <Link href="/projects" className="btn">See the student marketplace</Link>
    </div>
  );
}
