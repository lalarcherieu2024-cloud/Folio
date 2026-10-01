import Link from "next/link";
import { signOutAction } from "@/app/actions";
import type { StudentProfile } from "@/lib/types";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export function NavBar({ user }: { user: StudentProfile | null }) {
  const links = user
    ? ([["/projects", "Find projects"], ["/applications", "My applications"], ["/projects/new", "Request help"]] as const)
    : ([["/how-it-works", "How it works"], ["/projects", "Find projects"], ["/for-startups", "For startups"]] as const);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5 md:px-8">
        <Link href="/" aria-label="Folio home"><Logo /></Link>
        <NavLinks links={links} />
        {user ? (
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-bg py-1 pl-1 pr-3 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-soft text-sm font-extrabold text-blue">
                {user.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span className="max-w-[10ch] truncate text-sm">{user.fullName.split(" ")[0]}</span>
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
              <Link href="/profile" className="block rounded-lg px-3 py-2 hover:bg-bg">My profile & record</Link>
              <Link href="/applications" className="block rounded-lg px-3 py-2 hover:bg-bg">My applications</Link>
              <form action={signOutAction}>
                <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-bg">Sign out</button>
              </form>
            </div>
          </details>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/signin" className="rounded-lg px-3 py-2 font-semibold hover:bg-bg">Sign in</Link>
            <Link href="/signup" className="btn">Create account</Link>
          </div>
        )}
      </div>
    </header>
  );
}
