import { Building2, FolderKanban, House, LayoutGrid, ListChecks, Plus, PlusCircle, Search, User, Users, type LucideIcon } from "lucide-react";
import type { Role } from "@/lib/types";

export type NavEntry = { href: string; label: string; icon: LucideIcon; count?: number; active: boolean };
export type NavCounts = Record<string, number>;

// Each side owns its list. Add a link by adding one line to your role's list.
export function navFor(role: Role, path: string, counts: NavCounts): NavEntry[] {
  if (role === "company") {
    return [
      { href: "/company", label: "Dashboard", icon: LayoutGrid, active: path === "/company" },
      { href: "/company/projects", label: "My projects", icon: FolderKanban, count: counts.projects, active: path.startsWith("/company/projects") && !path.startsWith("/company/projects/new") },
      { href: "/company/applicants", label: "Applicants", icon: Users, count: counts.applicants, active: path.startsWith("/company/applicants") },
      { href: "/company/projects/new", label: "Post a project", icon: PlusCircle, active: path.startsWith("/company/projects/new") },
      { href: "/company/profile", label: "Company profile", icon: Building2, active: path.startsWith("/company/profile") },
    ];
  }
  return [
    { href: "/home", label: "Home", icon: House, active: path === "/home" },
    { href: "/projects", label: "Find projects", icon: Search, count: counts.open, active: path.startsWith("/projects") && !path.startsWith("/projects/new") },
    { href: "/applications", label: "My work", icon: ListChecks, count: counts.mine, active: path.startsWith("/applications") },
    { href: "/projects/new", label: "Request help", icon: Plus, active: path.startsWith("/projects/new") },
    { href: "/profile", label: "Profile & record", icon: User, active: path.startsWith("/profile") },
  ];
}

export const PAGE_TITLES: [string, string][] = [
  ["/company/projects/new", "Post a project"], ["/company/projects", "My projects"], ["/company/applicants", "Applicants"], ["/company/profile", "Company profile"], ["/company", "Dashboard"],
  ["/projects/new", "Request help"], ["/projects", "Find projects"], ["/applications", "My work"], ["/profile", "Profile & record"], ["/home", "Home"],
];
