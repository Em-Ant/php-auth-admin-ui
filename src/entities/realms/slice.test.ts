import { describe, expect, it } from "vitest";
import { fetchRealmById, fetchRealms, realmsReducer } from "./slice";

const realm = (id: string, name: string) => ({
  id,
  name,
  keys_id: "k",
  refresh_token_expires_in: 1800,
  access_token_expires_in: 300,
  pending_login_expires_in: 300,
  authenticated_login_expires_in: 300,
  session_expires_in: 86400,
  idle_session_expires_in: 1800,
  offline_refresh_token_expires_in: 2592000,
  password_policy: {
    min_length: null,
    min_lower: null,
    min_upper: null,
    min_digits: null,
    min_special: null,
  },
  scope: "openid profile email",
  created_at: "2026-01-10 09:00:00",
});

describe("realmsReducer", () => {
  it("starts with an empty idle list", () => {
    const state = realmsReducer(undefined, { type: "@@init" });

    expect(state.items).toEqual([]);
    expect(state.listStatus).toBe("idle");
    expect(state.total).toBe(0);
  });

  it("stores the applied pagination the API echoes back", () => {
    const pending = {
      type: fetchRealms.pending.type,
      meta: { requestId: "a" },
    };
    const loading = realmsReducer(undefined, pending);
    const fulfilled = {
      type: fetchRealms.fulfilled.type,
      meta: { requestId: "a" },
      payload: { items: [realm("1", "web")], total: 42, limit: 50, offset: 0 },
    };

    const state = realmsReducer(loading, fulfilled);

    expect(state.items).toHaveLength(1);
    expect(state.total).toBe(42);
    expect(state.limit).toBe(50);
    expect(state.listStatus).toBe("succeeded");
  });

  it("ignores a stale list response", () => {
    const first = { type: fetchRealms.pending.type, meta: { requestId: "a" } };
    const second = { type: fetchRealms.pending.type, meta: { requestId: "b" } };
    const loading = realmsReducer(realmsReducer(undefined, first), second);
    const stale = {
      type: fetchRealms.fulfilled.type,
      meta: { requestId: "a" },
      payload: { items: [realm("1", "web")], total: 1, limit: 20, offset: 0 },
    };

    const state = realmsReducer(loading, stale);

    expect(state.items).toEqual([]);
    expect(state.listStatus).toBe("loading");
  });

  it("stores a failed list fetch", () => {
    const pending = {
      type: fetchRealms.pending.type,
      meta: { requestId: "a" },
    };
    const loading = realmsReducer(undefined, pending);
    const failed = {
      type: fetchRealms.rejected.type,
      meta: { requestId: "a" },
      payload: { status: 401, message: "unauthorized" },
    };

    const state = realmsReducer(loading, failed);

    expect(state.listStatus).toBe("failed");
    expect(state.listError).toMatchObject({ message: "unauthorized" });
  });

  it("stores the loaded detail", () => {
    const pending = {
      type: fetchRealmById.pending.type,
      meta: { requestId: "a" },
    };
    const loading = realmsReducer(undefined, pending);
    const fulfilled = {
      type: fetchRealmById.fulfilled.type,
      meta: { requestId: "a" },
      payload: realm("1", "web"),
    };

    const state = realmsReducer(loading, fulfilled);

    expect(state.detail?.name).toBe("web");
    expect(state.detailStatus).toBe("succeeded");
  });
});
