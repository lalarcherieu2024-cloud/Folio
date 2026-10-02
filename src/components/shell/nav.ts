import { Building2, FolderKanban, House, ListChecks, Plus, Search, User, Users, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import type { Role } from "@/lib/types";

export type NavEntry = { href: string; label: string; icon: LucideIcon; count?: number; active: boolean };
export type NavCounts = Record<string, number>;

// Each side owns its list. Add a link by adding one line to your role's list.
export function navFor(role: Role, path: string, counts: NavCounts): NavEntry[] {
  if (role === "company") {
    return [
      { href: "/company", label: "Dashboard", icon: Building2, active: path === "/company" },
      { href: "/company/projects", label: "My projects", icon: FolderKanban, count: counts.projects, active: path.startsWith("/company/projects") && !path.startsWith("/company/projects/new") },
      { href: "/company/applicants", label: "Applicants", icon: Users, count: counts.applicants, active: path.startsWith("/company/applicants") },
      { href: "/company/projects/new", label: "Post a project", icon: Plus, active: path.startsWith("/company/projects/new") },
    ];
  }
  return [
    { href: "/home", label: "Home", icon: House, active: path === "/home" },
    { href: "/projects", label: "Find projects", icon: Search, count: counts.open, active: path.startsWith("/projects") && !path.startsWith("/projects/new") },
    { href: "/applications", label: "My work", icon: ListChecks, count: counts.mine, active: path.startsWith("/applications") || path.startsWith("/requests") },
    { href: "/payments", label: "Payments", icon: Wallet, active: path.startsWith("/payments") },
    { href: "/progress", label: "Progress", icon: TrendingUp, active: path.startsWith("/progress") },
    { href: "/profile", label: "Profile & record", icon: User, active: path.startsWith("/profile") },
  ];
}

export const PAGE_TITLES: [string, string][] = [
  ["/requests", "My work"],
  ["/company/projects/new", "Post a project"], ["/company/projects", "My projects"], ["/company/applicants", "Applicants"], ["/company", "Dashboard"],
  ["/projects/new", "Post a project"], ["/projects", "Find projects"], ["/applications", "My work"], ["/payments", "Payments"], ["/progress", "Progress"], ["/profile", "Profile & record"], ["/home", "Home"],
];
