"use client";

import { Building2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type AccountRole = "student" | "company";

// Student | Company switch on the auth pages. Sign-in is one shared form, so it switches in
// place (onSelect). Sign-up has a separate screen per side, so it links to the other page.
const SIGNUP: Record<AccountRole, string> = { student: "/signup", company: "/company/signup" };
const OPTS = [["student", "Student", GraduationCap], ["company", "Company", Building2]] as const;

export function RoleSwitch({ role, onSelect }: { role: AccountRole; onSelect?: (r: AccountRole) => void }) {
  const cls = (on: boolean) => cn("flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
    on ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground");
  return (
    <div role={onSelect ? "radiogroup" : undefined} aria-label="Account type" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {OPTS.map(([id, label, Icon]) => onSelect
        ? <button key={id} type="button" role="radio" aria-checked={role === id} onClick={() => onSelect(id)} className={cls(role === id)}><Icon className="size-4" />{label}</button>
        : <Link key={id} href={SIGNUP[id]} aria-current={role === id ? "page" : undefined} className={cls(role === id)}><Icon className="size-4" />{label}</Link>)}
    </div>
  );
}
