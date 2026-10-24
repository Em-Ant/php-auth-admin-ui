import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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
const ADMIN_ROLE_ID = "r0000000-0000-0000-0000-000000000001";

describe("roles flow", () => {
  it("lists roles with scope badges", async () => {
    renderRoute("/roles");

    expect(await screen.findByRole("link", { name: "admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewer" })).toBeInTheDocument();
  });

  it("creates a realm role", async () => {
    const user = userEvent.setup();
    renderRoute("/roles");

    await user.click(await screen.findByRole("button", { name: "Create role" }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Realm"), [TEST_REALM]);
    await user.type(within(dialog).getByLabelText("Name"), "auditor");
    await user.click(within(dialog).getByRole("button", { name: "Create role" }));

    expect(await screen.findByRole("link", { name: "auditor" })).toBeInTheDocument();
  });

  it("shows the delete guard message for assigned roles", async () => {
    const user = userEvent.setup();
    renderRoute(`/roles/${ADMIN_ROLE_ID}`);

    expect(await screen.findByRole("heading", { name: "admin" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete role" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete role" }));

    expect(
      await screen.findByText(
        "role is still assigned to users or referenced by a scope-role mapping",
      ),
    ).toBeInTheDocument();
  });
});
