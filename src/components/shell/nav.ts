import { Building2, FolderKanban, House, LayoutGrid, ListChecks, PlusCircle, Search, TrendingUp, User, Users, Wallet, type LucideIcon } from "lucide-react";
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
    { href: "/projects", label: "Find projects", icon: Search, count: counts.open, active: path.startsWith("/projects") },
    { href: "/applications", label: "My work", icon: ListChecks, count: counts.mine, active: path.startsWith("/applications") },
    { href: "/payments", label: "Payments", icon: Wallet, active: path.startsWith("/payments") },
    { href: "/progress", label: "Progress", icon: TrendingUp, active: path.startsWith("/progress") },
    { href: "/profile", label: "Profile & record", icon: User, active: path.startsWith("/profile") },
  ];
}
