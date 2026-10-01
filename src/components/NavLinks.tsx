"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: readonly (readonly [string, string])[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1">
      {links.map(([href, label]) => {
        const active = path === href || (href !== "/projects" && path.startsWith(href + "/")) || (href === "/projects" && path.startsWith("/projects") && !path.startsWith("/projects/new"));
        return (
          <Link
            key={href} href={href} aria-current={active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 font-semibold ${active ? "bg-blue-soft text-ink" : "text-muted hover:bg-bg hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
