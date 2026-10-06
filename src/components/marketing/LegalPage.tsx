import Link from "next/link";
import { LEGAL_PAGES, LEGAL_UPDATED } from "@/lib/legal";
import { cn } from "@/lib/utils";

// The frame every legal page shares: title, date, contents, then numbered sections.

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export function LegalPage({ title, intro, sections, current }: { title: string; intro: React.ReactNode; sections: LegalSection[]; current: string }) {
  return (
    <div className="mx-auto w-full max-w-[75rem] px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Legal" className="flex flex-wrap gap-1 text-sm lg:sticky lg:top-24 lg:flex-col lg:self-start">
          <span className="mb-1 hidden text-xs font-medium uppercase tracking-wide text-muted-foreground lg:block">Legal</span>
          {LEGAL_PAGES.map((p) => (
            <Link key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined}
              className={cn("rounded-md px-2.5 py-1.5", p.href === current ? "bg-soft font-medium text-brand" : "text-muted-foreground hover:bg-panel hover:text-foreground")}>{p.label}</Link>
          ))}
        </nav>

        <article className="min-w-0 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>
          <div className="legal-prose mt-6">{intro}</div>

          <ol className="mt-8 grid gap-1 rounded-xl border bg-white p-5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => <li key={s.id}><a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground"><span className="tabular-nums">{i + 1}.</span> {s.title}</a></li>)}
          </ol>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t pt-8 mt-8">
              <h2 className="text-xl font-semibold tracking-tight"><span className="tabular-nums text-muted-foreground">{i + 1}.</span> {s.title}</h2>
              <div className="legal-prose mt-3">{s.body}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

/** A value from src/lib/legal.ts. Anything still marked "[TO FILL" is highlighted so it can't slip through review. */
export function Fill({ children }: { children: string }) {
  return children.startsWith("[TO FILL")
    ? <mark className="rounded bg-[#fef3c7] px-1 text-[#92400e]">{children}</mark>
    : <>{children}</>;
}

/** A plain table for the processor and cookie lists. */
export function LegalTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-panel"><tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t align-top">{r.map((c, j) => <td key={j} className="px-3 py-2 text-zinc-600">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
