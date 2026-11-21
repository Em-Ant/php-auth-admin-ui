import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("audit logs flow", () => {
  it("lists entries with action links", async () => {
    renderRoute(`/${TEST_REALM}/audit-logs`);

    expect(
      await screen.findByRole("link", { name: "user.create" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "client.create" }),
    ).toBeInTheDocument();
  });

  it("shows the entry detail", async () => {
    const user = userEvent.setup();
    renderRoute(`/${TEST_REALM}/audit-logs`);

    await user.click(await screen.findByRole("link", { name: "user.create" }));

    expect(await screen.findByText("Detail payload")).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();
  });

  it("purges only the active realm's audit entries", async () => {
    const user = userEvent.setup();
    renderRoute(`/${TEST_REALM}/audit-logs`);

    await user.click(await screen.findByRole("button", { name: "Purge…" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Purge entries" }),
    );

    // The realm owns two entries; the NULL-realm row is out of scope.
    expect(await screen.findByText("Purged 2 entries.")).toBeInTheDocument();
    expect(
      await screen.findByText("No entries match these filters."),
    ).toBeInTheDocument();
  });
});
