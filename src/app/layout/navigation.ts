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
  /** Absolute path when global; realm-relative path when scoped. */
  to: string;
  icon: LucideIcon;
  /** Scoped items live under `/:realmId` and need an active realm. */
  scoped: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navigation follows the domain hierarchy: everything hangs off a realm, and
 * the three session-shaped resources get their own entries because they
 * answer different questions. `Realms` and `Overview` stay global; the rest
 * are scoped under the active realm.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      {
        title: "Overview",
        to: "/overview",
        icon: LayoutDashboard,
        scoped: false,
      },
    ],
  },
  {
    label: "Identity",
    items: [
      { title: "Realms", to: "/realms", icon: Globe, scoped: false },
      { title: "Clients", to: "/clients", icon: AppWindow, scoped: true },
      { title: "Users", to: "/users", icon: Users, scoped: true },
      { title: "Roles", to: "/roles", icon: Shield, scoped: true },
    ],
  },
  {
    label: "Activity",
    items: [
      { title: "Sessions", to: "/sessions", icon: Monitor, scoped: true },
      { title: "Logins", to: "/logins", icon: LogIn, scoped: true },
      {
        title: "Offline sessions",
        to: "/offline-sessions",
        icon: KeyRound,
        scoped: true,
      },
      { title: "Audit log", to: "/audit-logs", icon: ScrollText, scoped: true },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

/** Scoped path roots, e.g. `clients`, for redirecting unprefixed paths. */
export const SCOPED_ROOTS = NAV_ITEMS.filter((item) => item.scoped).map(
  (item) => item.to.replace(/^\//, ""),
);

/** Where a nav item points for the given active realm. */
export const navHref = (item: NavItem, realmId: string | null): string => {
  if (!item.scoped) {
    return item.to;
  }
  return realmId === null ? "/realms" : `/${realmId}${item.to}`;
};

const matchesScoped = (item: NavItem, pathname: string) =>
  new RegExp(`^/[^/]+${item.to}(/|$)`).test(pathname);

/** Whether `pathname` falls inside the given nav item. */
export const isNavItemActive = (item: NavItem, pathname: string): boolean =>
  item.scoped
    ? matchesScoped(item, pathname)
    : pathname === item.to || pathname.startsWith(`${item.to}/`);

export const pageTitleFor = (pathname: string) =>
  NAV_ITEMS.find((item) => isNavItemActive(item, pathname))?.title ??
  "Admin UI";
