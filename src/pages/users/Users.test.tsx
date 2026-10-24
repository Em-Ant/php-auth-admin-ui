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
const ADA_USER = "u0000000-0000-0000-0000-000000000001";

describe("users flow", () => {
  it("lists users with status badges", async () => {
    renderRoute("/users");

    expect(await screen.findByRole("link", { name: "ada@example.com" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "carol@example.com" })).toBeInTheDocument();
    expect(screen.getByText("deactivated")).toBeInTheDocument();
  });

  it("creates a user", async () => {
    const user = userEvent.setup();
    renderRoute("/users");

    await user.click(await screen.findByRole("button", { name: "Create user" }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Realm"), [TEST_REALM]);
    await user.type(within(dialog).getByLabelText("Email"), "erin@example.com");
    await user.type(within(dialog).getByLabelText("Password"), "ChangeMe123");
    await user.click(within(dialog).getByRole("button", { name: "Create user" }));

    expect(await screen.findByRole("link", { name: "erin@example.com" })).toBeInTheDocument();
  });

  it("shows the delete guard message", async () => {
    const user = userEvent.setup();
    renderRoute(`/users/${ADA_USER}`);

    expect(await screen.findByRole("heading", { name: "ada@example.com" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete user" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete user" }));

    expect(
      await screen.findByText("user still has an active session or offline session"),
    ).toBeInTheDocument();
  });
});
