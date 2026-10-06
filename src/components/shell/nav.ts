import { ChecklistIcon, HomeIcon, MessagesIcon, ProApplicantsIcon, ProImpactIcon, ProMessagesIcon, ProOverviewIcon, ProPaymentsIcon, ProPostIcon, ProProjectsIcon, SearchIcon, TrendIcon, WalletIcon, type NavIcon } from "./NavIcons";
import type { Role } from "@/lib/types";

export type NavEntry = { href: string; label: string; icon: NavIcon; count?: number; alert?: boolean; active: boolean };
export type NavCounts = Record<string, number>;

// Each side owns its list. Add a link by adding one line to your role's list.
export function navFor(role: Role, path: string, counts: NavCounts): NavEntry[] {
  if (role === "company") {
    // Mirrors the student list: the work (projects + applicants), Messages, Payments, Impact (= Progress).
    return [
      { href: "/company", label: "Home", icon: ProOverviewIcon, active: path === "/company" },
      { href: "/company/projects", label: "Projects", icon: ProProjectsIcon, count: counts.projects, active: path.startsWith("/company/projects") && !path.startsWith("/company/projects/new") },
      { href: "/company/applicants", label: "Applicants", icon: ProApplicantsIcon, count: counts.applicants, active: path.startsWith("/company/applicants") },
      { href: "/company/messages", label: "Messages", icon: ProMessagesIcon, count: counts.messages || undefined, alert: true, active: path.startsWith("/company/messages") },
      { href: "/company/payments", label: "Payments", icon: ProPaymentsIcon, active: path.startsWith("/company/payments") },
      { href: "/company/impact", label: "Impact", icon: ProImpactIcon, active: path.startsWith("/company/impact") },
      { href: "/company/projects/new", label: "Post a project", icon: ProPostIcon, active: path.startsWith("/company/projects/new") },
      // Company profile lives in the account menu under your photo, top right (UserMenu).
    ];
  }
  return [
    { href: "/home", label: "Home", icon: HomeIcon, active: path === "/home" },
    { href: "/projects", label: "Find projects", icon: SearchIcon, count: counts.open, active: path.startsWith("/projects") },
    { href: "/applications", label: "My work", icon: ChecklistIcon, count: counts.mine, active: path.startsWith("/applications") },
    { href: "/messages", label: "Messages", icon: MessagesIcon, count: counts.messages || undefined, alert: true, active: path.startsWith("/messages") },
    { href: "/payments", label: "Payments", icon: WalletIcon, active: path.startsWith("/payments") },
    { href: "/progress", label: "Progress", icon: TrendIcon, active: path.startsWith("/progress") },
    // Profile & record lives in the account menu under your photo, top right (UserMenu).
  ];
}
