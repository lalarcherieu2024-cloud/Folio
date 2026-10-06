import { BuildingIcon, ChecklistIcon, DashboardIcon, FolderIcon, HomeIcon, MessagesIcon, PlusIcon, ProfileIcon, SearchIcon, TrendIcon, UsersIcon, WalletIcon, type NavIcon } from "./NavIcons";
import type { Role } from "@/lib/types";

export type NavEntry = { href: string; label: string; icon: NavIcon; count?: number; alert?: boolean; active: boolean };
export type NavCounts = Record<string, number>;

// Each side owns its list. Add a link by adding one line to your role's list.
export function navFor(role: Role, path: string, counts: NavCounts): NavEntry[] {
  if (role === "company") {
    return [
      { href: "/company", label: "Dashboard", icon: DashboardIcon, active: path === "/company" },
      { href: "/company/projects", label: "My projects", icon: FolderIcon, count: counts.projects, active: path.startsWith("/company/projects") && !path.startsWith("/company/projects/new") },
      { href: "/company/applicants", label: "Applicants", icon: UsersIcon, count: counts.applicants, active: path.startsWith("/company/applicants") },
      { href: "/company/projects/new", label: "Post a project", icon: PlusIcon, active: path.startsWith("/company/projects/new") },
      { href: "/company/profile", label: "Company profile", icon: BuildingIcon, active: path.startsWith("/company/profile") },
    ];
  }
  return [
    { href: "/home", label: "Home", icon: HomeIcon, active: path === "/home" },
    { href: "/projects", label: "Find projects", icon: SearchIcon, count: counts.open, active: path.startsWith("/projects") },
    { href: "/applications", label: "My work", icon: ChecklistIcon, count: counts.mine, active: path.startsWith("/applications") },
    { href: "/messages", label: "Messages", icon: MessagesIcon, count: counts.messages || undefined, alert: true, active: path.startsWith("/messages") },
    { href: "/payments", label: "Payments", icon: WalletIcon, active: path.startsWith("/payments") },
    { href: "/progress", label: "Progress", icon: TrendIcon, active: path.startsWith("/progress") },
    { href: "/profile", label: "Profile & record", icon: ProfileIcon, active: path.startsWith("/profile") },
  ];
}
