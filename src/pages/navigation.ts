import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogIn,
  Monitor,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navigation follows the screen map in admin-ui/DOMAIN-MODEL.md §6:
 * everything hangs off a realm, and the three session-shaped resources get
 * their own entries because they answer different questions.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ title: "Overview", href: "/overview", icon: LayoutDashboard }],
  },
  {
    label: "Identity",
    items: [
      { title: "Realms", href: "/realms", icon: Globe },
      { title: "Clients", href: "/clients", icon: AppWindow },
      { title: "Users", href: "/users", icon: Users },
      { title: "Roles", href: "/roles", icon: Shield },
    ],
  },
  {
    label: "Activity",
    items: [
      { title: "Sessions", href: "/sessions", icon: Monitor },
      { title: "Logins", href: "/logins", icon: LogIn },
      { title: "Offline sessions", href: "/offline-sessions", icon: KeyRound },
      { title: "Audit log", href: "/audit-logs", icon: ScrollText },
    ],
  },
];

export const pageTitleFor = (pathname: string) =>
  NAV_GROUPS.flatMap((group) => group.items).find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.title ?? "Admin UI";
