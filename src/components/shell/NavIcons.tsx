// Two-tone sidebar icons: a soft tinted fill, a darker outline and a few solid details.
// Each section has its own colour so it is easy to spot at a glance (also when the sidebar is collapsed).
import { BarChart3, FolderKanban, LayoutDashboard, MessageSquare, PlusCircle, Users, Wallet, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type NavIcon = (props: { className?: string }) => ReactNode;

function Svg({ className, color, children }: { className?: string; color: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  );
}

const sky = { c: "#0369a1", t: "#bae6fd" };
const violet = { c: "#6d28d9", t: "#ddd6fe" };
const amber = { c: "#b45309", t: "#fde68a" };
const emerald = { c: "#047857", t: "#a7f3d0" };
const orange = { c: "#c2410c", t: "#fed7aa" };
const indigo = { c: "#4338ca", t: "#c7d2fe" };
const cyan = { c: "#0e7490", t: "#a5f3fc" };

export const HomeIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={sky.c}>
    <path d="M16 5.5V4h2v3.2" fill={sky.t} />
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.5L12 4.5z" fill={sky.t} />
    <path d="M10 20.5v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5" fill={sky.c} />
    <rect x="10.5" y="9" width="3" height="3" rx=".5" fill="#fff" />
  </Svg>
);

export const SearchIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={violet.c}>
    <circle cx="10.5" cy="10.5" r="6.5" fill={violet.t} />
    <path d="M7.6 9.2a3.2 3.2 0 0 1 2.4-2.4" stroke="#fff" strokeWidth={1.8} />
    <path d="m15.5 15.5 4.5 4.5" strokeWidth={2.6} />
  </Svg>
);

export const ChecklistIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={amber.c}>
    <rect x="4.5" y="4.5" width="15" height="16" rx="3.2" fill={amber.t} />
    <rect x="9" y="3" width="6" height="3.2" rx="1.6" fill={amber.c} />
    <path d="m7.5 11 1.3 1.3 2.4-2.6M7.5 16.2l1.3 1.3 2.4-2.6" />
    <path d="M13.5 11.3H16.5M13.5 16.5H16.5" />
  </Svg>
);

export const MessagesIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={emerald.c}>
    <path d="M8.5 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-.5" fill="#fff" />
    <path d="M3.5 11a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v3.5a3 3 0 0 1-3 3H9.5l-3.2 2.8a.5.5 0 0 1-.8-.4v-2.6a3 3 0 0 1-2-2.8z" fill={emerald.t} />
    <g fill={emerald.c} stroke="none"><circle cx="7" cy="12.8" r="1" /><circle cx="10" cy="12.8" r="1" /><circle cx="13" cy="12.8" r="1" /></g>
  </Svg>
);

export const WalletIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={orange.c}>
    <path d="m6 7.5 9.8-3.2a1.5 1.5 0 0 1 1.9 1l.6 2.2" fill="#fff" />
    <rect x="3.5" y="7.5" width="17" height="13" rx="3.5" fill={orange.t} />
    <rect x="14" y="11.5" width="6.5" height="5" rx="2.5" fill="#fff" />
    <circle cx="16.6" cy="14" r="1" fill={orange.c} stroke="none" />
  </Svg>
);

export const TrendIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={indigo.c}>
    <rect x="4" y="15" width="3.2" height="5.5" rx="1.6" fill={indigo.t} />
    <rect x="10.4" y="12.5" width="3.2" height="8" rx="1.6" fill={indigo.t} />
    <rect x="16.8" y="10" width="3.2" height="10.5" rx="1.6" fill={indigo.t} />
    <path d="m3.5 11.5 5-4 3.5 2.2 7.5-6" strokeWidth={1.8} />
    <path d="M16.2 3.5h3.3v3.3" strokeWidth={1.8} />
  </Svg>
);

export const ProfileIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={cyan.c}>
    <circle cx="12" cy="8" r="4" fill={cyan.t} />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0z" fill={cyan.t} />
  </Svg>
);

export const DashboardIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={sky.c}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.6" fill={sky.t} />
    <rect x="13" y="3.5" width="7.5" height="5" rx="2.6" fill={sky.c} />
    <rect x="13" y="10.5" width="7.5" height="10" rx="2.6" fill={sky.t} />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.6" fill="#fff" />
  </Svg>
);

export const FolderIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={amber.c}>
    <path d="M3 7a1.5 1.5 0 0 1 1.5-1.5h4.3l2 2.2h8.7A1.5 1.5 0 0 1 21 9.2V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" fill={amber.t} />
    <g fill={amber.c} stroke="none"><rect x="7" y="11" width="2.4" height="5.5" rx="1.2" /><rect x="10.8" y="11" width="2.4" height="3.5" rx="1.2" /><rect x="14.6" y="11" width="2.4" height="6" rx="1.2" /></g>
  </Svg>
);

export const UsersIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={violet.c}>
    <circle cx="16.5" cy="8.5" r="2.5" fill="#fff" />
    <path d="M14 13.6a4.2 4.2 0 0 1 6.8 3.4v1.5h-4" fill="#fff" />
    <circle cx="9" cy="8.5" r="3.2" fill={violet.t} />
    <path d="M3 19.5a6 6 0 0 1 12 0z" fill={violet.t} />
  </Svg>
);

export const PlusIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={emerald.c}>
    <circle cx="12" cy="12" r="8.5" fill={emerald.t} />
    <path d="M12 8v8M8 12h8" strokeWidth={2.2} />
  </Svg>
);

export const BuildingIcon: NavIcon = ({ className }) => (
  <Svg className={className} color={indigo.c}>
    <rect x="15" y="9" width="5.5" height="11.5" rx="2" fill="#fff" />
    <rect x="4" y="3.5" width="11" height="17" rx="2.2" fill={indigo.t} />
    <g fill={indigo.c} stroke="none">
      <rect x="6.5" y="6.5" width="2" height="2" rx=".9" /><rect x="10.5" y="6.5" width="2" height="2" rx=".9" />
      <rect x="6.5" y="10.5" width="2" height="2" rx=".9" /><rect x="10.5" y="10.5" width="2" height="2" rx=".9" />
      <rect x="8.2" y="15.5" width="2.6" height="5" rx=".9" />
    </g>
    <path d="M17 12.5h1.5M17 15.5h1.5" />
  </Svg>
);

// ---- Company workspace: plain monochrome line icons (they take the text colour), for a more formal look.
const line = (I: LucideIcon): NavIcon => function LineIcon({ className }) { return <I className={className} strokeWidth={1.6} aria-hidden />; };
export const ProOverviewIcon = line(LayoutDashboard);
export const ProProjectsIcon = line(FolderKanban);
export const ProApplicantsIcon = line(Users);
export const ProMessagesIcon = line(MessageSquare);
export const ProPaymentsIcon = line(Wallet);
export const ProImpactIcon = line(BarChart3);
export const ProPostIcon = line(PlusCircle);
