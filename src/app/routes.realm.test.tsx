import { screen, waitFor } from "@testing-library/react";
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
import { renderRoute } from "@/test/render-route";

vi.mock("@/app/bootstrap", () => ({ default: async () => undefined }));

vi.mock("@/shared/auth", () => ({
  ADMIN_ROLE: "admin",
  isAuthenticated: async () => true,
  hasRole: async () => true,
  getUser: async () => ({ name: "admin", roles: ["admin"] }),
  getToken: async () => "test-token",
  forceTokenRefresh: async () => undefined,
}));

vi.mock("@/shared/config", () => ({
  getConfig: async () => ({
    app: { apiHome: "http://localhost" },
    auth: { url: "http://localhost", realm: "test", clientId: "local" },
  }),
}));

beforeAll(() => mockServer.listen({ onUnhandledFrame: "error" }));
beforeEach(() => resetMockDb());
afterAll(() => mockServer.close());

const TEST_REALM = "11111111-1111-1111-1111-111111111111";

describe("realm-scoped routes", () => {
  it("redirects an unprefixed scoped path under the active realm", async () => {
    const { router } = renderRoute("/clients");

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/${TEST_REALM}/clients`),
    );
  });

  it("sets the active realm and the shell pill from a deep link", async () => {
    const { router, store } = renderRoute(`/${TEST_REALM}/clients`);

    expect(
      await screen.findByRole("link", { name: "admin-ui" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/${TEST_REALM}/clients`);
    expect(store.getState().realm).toEqual({ id: TEST_REALM, name: "test" });
  });

  it("sends an unknown realm id to the realms list", async () => {
    const { router, store } = renderRoute("/unknown-realm/clients");

    await waitFor(() => expect(router.state.location.pathname).toBe("/realms"));
    expect(store.getState().realm.id).toBeNull();
  });

  it("resolves the default realm on the landing overview", async () => {
    const { store } = renderRoute("/");

    await waitFor(() =>
      expect(store.getState().realm).toEqual({ id: TEST_REALM, name: "test" }),
    );
  });
});
