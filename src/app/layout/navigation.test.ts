import { describe, expect, it } from "vitest";
import {
  isNavItemActive,
  NAV_GROUPS,
  navHref,
  pageTitleFor,
} from "./navigation";

const item = (title: string) => {
  const found = NAV_GROUPS.flatMap((group) => group.items).find(
    (navItem) => navItem.title === title,
  );
  if (!found) {
    throw new Error(`No nav item titled ${title}`);
  }
  return found;
};

describe("navHref", () => {
  it("keeps global items unprefixed", () => {
    expect(navHref(item("Overview"), "realm-1")).toBe("/overview");
    expect(navHref(item("Realms"), "realm-1")).toBe("/realms");
  });

  it("prefixes scoped items with the active realm", () => {
    expect(navHref(item("Clients"), "realm-1")).toBe("/realm-1/clients");
    expect(navHref(item("Offline sessions"), "realm-1")).toBe(
      "/realm-1/offline-sessions",
    );
  });

  it("sends scoped items to the realms list without an active realm", () => {
    expect(navHref(item("Clients"), null)).toBe("/realms");
  });
});

describe("isNavItemActive", () => {
  it("matches a scoped item under any realm prefix", () => {
    expect(isNavItemActive(item("Clients"), "/realm-1/clients")).toBe(true);
    expect(isNavItemActive(item("Clients"), "/realm-1/clients/c0000000")).toBe(
      true,
    );
    expect(isNavItemActive(item("Clients"), "/realm-1/users")).toBe(false);
  });

  it("matches global items only at the root", () => {
    expect(isNavItemActive(item("Overview"), "/overview")).toBe(true);
    expect(isNavItemActive(item("Overview"), "/realm-1/overview")).toBe(false);
  });
});

describe("pageTitleFor", () => {
  it("resolves a realm-scoped page", () => {
    expect(pageTitleFor("/realm-1/clients")).toBe("Clients");
    expect(pageTitleFor("/realm-1/audit-logs/c0000000")).toBe("Audit log");
  });

  it("resolves global pages", () => {
    expect(pageTitleFor("/overview")).toBe("Overview");
    expect(pageTitleFor("/realms")).toBe("Realms");
  });

  it("falls back for unknown paths", () => {
    expect(pageTitleFor("/nope")).toBe("Admin UI");
  });
});
