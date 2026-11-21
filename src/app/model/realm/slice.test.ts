import { describe, expect, it } from "vitest";
import { clearActiveRealm, realmReducer, setActiveRealm } from "./slice";
import { clearStoredRealm, readStoredRealm, writeStoredRealm } from "./storage";

describe("realmReducer", () => {
  it("starts with no active realm", () => {
    expect(realmReducer(undefined, { type: "@@init" })).toEqual({
      id: null,
      name: null,
    });
  });

  it("sets the active realm", () => {
    const state = realmReducer(
      undefined,
      setActiveRealm({ id: "1", name: "admin" }),
    );

    expect(state).toEqual({ id: "1", name: "admin" });
  });

  it("clears the active realm", () => {
    const active = realmReducer(
      undefined,
      setActiveRealm({ id: "1", name: "admin" }),
    );

    expect(realmReducer(active, clearActiveRealm())).toEqual({
      id: null,
      name: null,
    });
  });
});

describe("active realm storage", () => {
  it("round-trips a stored realm", () => {
    writeStoredRealm({ id: "1", name: "admin" });

    expect(readStoredRealm()).toEqual({ id: "1", name: "admin" });
  });

  it("treats corrupt storage as empty", () => {
    window.localStorage.setItem("activeRealm", "not json");

    expect(readStoredRealm()).toBeNull();
  });

  it("ignores a record missing fields", () => {
    window.localStorage.setItem("activeRealm", JSON.stringify({ id: "1" }));

    expect(readStoredRealm()).toBeNull();
  });

  it("clears the stored realm", () => {
    writeStoredRealm({ id: "1", name: "admin" });

    clearStoredRealm();

    expect(readStoredRealm()).toBeNull();
  });
});
