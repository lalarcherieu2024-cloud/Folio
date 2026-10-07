import Link from "next/link";
import { ReviewCard, Rows } from "@/components/admin/ReviewCard";
import { ago, card } from "@/components/startup/ui";
import { adminOpenForAll, requireAdmin } from "@/lib/admin";
import { getReviewData } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Folio" };

// ADMIN. Company verification: who's waiting, with what Folio checks, and one click to approve or ask for a change.
export default async function AdminPage() {
  const me = await requireAdmin();
  // It reads every account, so it needs the service-role key; say how to add it rather than failing.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return (
    <div className={cn(card, "mx-auto flex max-w-[40rem] flex-col gap-2 p-6")}>
      <h1 className="text-xl font-semibold tracking-tight">One setting is missing</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        The admin page reads every company, so it needs Supabase&apos;s service-role key. In Supabase, open Project Settings → API, copy the <b>service_role</b> key,
        and add it to <code className="font-mono">.env.local</code> as <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY=…</code> (and to your host&apos;s environment variables when you deploy). Then restart the dev server.
      </p>
      <p className="text-xs text-muted-foreground">Keep it secret: it bypasses every access rule. Never put it in a NEXT_PUBLIC_ variable.</p>
    </div>
  );
  const { companies, withoutDetails } = await getReviewData();
  const by = (s: string) => companies.filter((c) => c.status === s);
  const waiting = by("pending").sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "")); // oldest first
  const changes = by("rejected");
  const drafts = by("draft").sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const verified = by("verified").sort((a, b) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? ""));
  const kpis = [["Waiting for review", waiting.length], ["Changes requested", changes.length], ["Verified", verified.length], ["Started, not sent", drafts.length], ["Signed up, no details", withoutDetails]] as const;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em]">Company review</h1>
        <p className="text-[0.9375rem] text-muted-foreground">Approve companies so they can publish projects. Check the CIF (or the founder&apos;s IE email) and the website, then decide. Signed in as {me.email}.</p>
      </div>
      {adminOpenForAll && <p className="rounded-lg border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3 text-[0.8125rem] text-[#92400e]"><b className="font-semibold">Development:</b> any signed-in account can open this page. Set <code className="font-mono">ADMIN_EMAILS</code> (comma-separated) before deploying.</p>}

      <div className={cn(card, "grid grid-cols-2 divide-zinc-100 sm:grid-cols-5 sm:divide-x")}>
        {kpis.map(([k, v], i) => (
          <div key={k} className={cn("flex flex-col gap-1 px-5 py-4", i < 4 && "border-b border-zinc-100 sm:border-b-0")}>
            <span className="text-xs font-medium text-muted-foreground">{k}</span>
            <span className={cn("font-mono text-2xl font-semibold", i === 0 && v > 0 && "text-[#92400e]")}>{v}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Waiting for review</h2>
        {waiting.length === 0
          ? <p className="rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-muted-foreground">Nobody is waiting. New companies show up here as soon as they send their details.</p>
          : waiting.map((c) => <ReviewCard key={c.id} c={c} />)}
      </section>

      <Rows title="Changes requested" sub="Waiting for the company to fix and resubmit." items={changes} render={(c) => c.reviewNote ?? ""} />
      <Rows title="Started, not sent" sub="They saved details but haven't sent them. Worth a nudge." items={drafts} render={(c) => `${c.owner.email}${c.createdAt ? ` · started ${ago(c.createdAt)}` : ""}`} />
      <Rows title="Verified" sub="Can publish projects." items={verified} render={(c) => <>{c.verifiedAt ? `Verified ${ago(c.verifiedAt)}` : "Verified"} · <Link href={`/companies/${c.id}`} className="underline underline-offset-2 hover:text-foreground">Public page</Link></>} />
    </div>
  );
}
