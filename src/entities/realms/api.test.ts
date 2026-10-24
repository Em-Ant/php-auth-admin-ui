import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mockServer, resetMockDb } from "@/mocks/server";

vi.mock("@/shared/config", () => ({
  getConfig: async () => ({
    app: { apiHome: "http://localhost" },
    auth: { url: "http://localhost", realm: "test", clientId: "local" },
  }),
}));

vi.mock("@/shared/auth", () => ({
  getToken: async () => "test-token",
  forceTokenRefresh: async () => undefined,
}));

import { createRealm, deleteRealm, listRealms } from "./api";

/**
 * The client against the MSW mock: proves the entity API and the mock agree
 * on the contract shapes both sides were written from.
 */
beforeAll(() => mockServer.listen({ onUnhandledFrame: "error" }));
beforeEach(() => resetMockDb());
afterAll(() => mockServer.close());

describe("realms api", () => {
  it("lists realms with the applied pagination", async () => {
    const envelope = await listRealms({ limit: 1, offset: 0 });

    expect(envelope.items).toHaveLength(1);
    expect(envelope).toMatchObject({ total: 2, limit: 1, offset: 0 });
  });

  it("creates and deletes a realm", async () => {
    const created = await createRealm({ name: "empty", keys_id: "k" });

    expect(created.name).toBe("empty");

    await deleteRealm(created.id);
    const envelope = await listRealms({ limit: 50, offset: 0 });

    expect(envelope.total).toBe(2);
  });

  it("surfaces the delete guard as an error", async () => {
    await expect(
      deleteRealm("11111111-1111-1111-1111-111111111111"),
    ).rejects.toMatchObject({ status: 409 });
  });
});
