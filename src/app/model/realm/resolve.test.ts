import { describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store/store";
import { fetchRealmOptions } from "@/entities/realms";
import type { RealmOption } from "@/shared/api/contract";
import { pickDefaultRealm, resolveActiveRealm } from "./resolve";
import { selectActiveRealmId } from "./selectors";
import { setActiveRealm } from "./slice";

vi.mock("@/shared/config", () => ({
  getConfig: async () => ({
    app: { apiHome: "http://localhost" },
    auth: { url: "http://localhost", realm: "admin", clientId: "local" },
  }),
}));

const options: RealmOption[] = [
  { id: "web-id", name: "web" },
  { id: "admin-id", name: "admin" },
];

const storeWithOptions = () => {
  const store = createAppStore();
  store.dispatch({ type: fetchRealmOptions.fulfilled.type, payload: options });
  return store;
};

describe("pickDefaultRealm", () => {
  it("prefers the operator realm by name", () => {
    expect(pickDefaultRealm(options, "admin")).toEqual(options[1]);
  });

  it("falls back to the first realm when the operator realm is absent", () => {
    expect(pickDefaultRealm(options, "missing")).toEqual(options[0]);
  });

  it("returns null when there are no realms", () => {
    expect(pickDefaultRealm([], "admin")).toBeNull();
  });
});

describe("resolveActiveRealm", () => {
  it("resolves the operator realm on a fresh load", async () => {
    const store = storeWithOptions();

    await store.dispatch(resolveActiveRealm());

    expect(selectActiveRealmId(store.getState())).toBe("admin-id");
  });

  it("keeps a stored realm that still exists", async () => {
    const store = storeWithOptions();
    store.dispatch(setActiveRealm({ id: "web-id", name: "web" }));

    await store.dispatch(resolveActiveRealm());

    expect(selectActiveRealmId(store.getState())).toBe("web-id");
  });

  it("falls back when the stored realm is no longer in the catalog", async () => {
    const store = storeWithOptions();
    store.dispatch(setActiveRealm({ id: "deleted-id", name: "deleted" }));

    await store.dispatch(resolveActiveRealm());

    expect(selectActiveRealmId(store.getState())).toBe("admin-id");
  });
});
