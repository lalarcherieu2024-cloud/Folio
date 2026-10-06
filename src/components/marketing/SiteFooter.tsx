import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal";
import { cn } from "@/lib/utils";

/** Links to the legal pages. Spanish law expects the legal notice and privacy policy to be reachable from every page. */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={cn("flex flex-wrap gap-x-4 gap-y-1", className)}>
      {LEGAL_PAGES.map((p) => <Link key={p.href} href={p.href} className="hover:text-foreground">{p.label}</Link>)}
    </nav>
  );
}

// Bottom of every signed-out page.
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-[75rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-8 text-[0.8125rem] text-muted-foreground">
        <span>Folio · IE University, Madrid</span>
        <LegalLinks />
      </div>
    </footer>
  );
}
