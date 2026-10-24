import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mockServer, resetMockDb } from "./server";

/**
 * Smoke test for the MSW mock: proves the node server answers at the API
 * boundary with contract-shaped envelopes. Future integration tests reuse
 * this setup (real store + real router, mock server instead of spies).
 */
beforeAll(() => mockServer.listen({ onUnhandledFrame: "error" }));
beforeEach(() => resetMockDb());
afterAll(() => mockServer.close());

const get = async (path: string) => {
  const response = await fetch(`http://localhost${path}`);
  return { status: response.status, body: await response.json() };
};

describe("mock admin API", () => {
  it("answers health and ready", async () => {
    const health = await get("/health");
    const ready = await get("/ready");

    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok" });
    expect(ready.body).toEqual({ status: "ok" });
  });

  it("lists realms in the envelope and reads limit back", async () => {
    const { status, body } = await get("/admin/realms?limit=1");

    expect(status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body).toMatchObject({ total: 2, limit: 1, offset: 0 });
  });

  it("replaces an out-of-range limit with the default", async () => {
    const { body } = await get("/admin/realms?limit=500");

    expect(body.limit).toBe(50);
    expect(body.total).toBe(2);
  });

  it("filters users by prefix query", async () => {
    const { body } = await get("/admin/users?q=ada");

    expect(body.total).toBe(1);
    expect(body.items[0]).toMatchObject({ email: "ada@example.com" });
  });

  it("keeps created users visible to later reads", async () => {
    const created = await fetch("http://localhost/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        realm_id: "11111111-1111-1111-1111-111111111111",
        email: "erin@example.com",
        password: "ChangeMe123",
      }),
    });

    expect(created.status).toBe(201);

    const { body } = await get(
      "/admin/users?realm_id=11111111-1111-1111-1111-111111111111&q=erin",
    );
    expect(body.total).toBe(1);
    expect(body.items[0]).toMatchObject({ email: "erin@example.com" });
  });

  it("guards realm delete while clients exist and deletes empty realms", async () => {
    const blocked = await fetch(
      "http://localhost/admin/realms/11111111-1111-1111-1111-111111111111",
      { method: "DELETE" },
    );
    expect(blocked.status).toBe(409);

    const created = await fetch("http://localhost/admin/realms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "empty", keys_id: "k" }),
    });
    const realm = await created.json();

    const deleted = await fetch(`http://localhost/admin/realms/${realm.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);

    const missing = await get(`/admin/realms/${realm.id}`);
    expect(missing.status).toBe(404);
  });
});
