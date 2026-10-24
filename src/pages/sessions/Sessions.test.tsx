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

describe("sessions flow", () => {
  it("lists sessions with status badges", async () => {
    renderRoute("/sessions");

    const table = await screen.findByRole("table");
    expect(within(table).getByText("ada@example.com")).toBeInTheDocument();
    expect(within(table).getByText("bob@example.com")).toBeInTheDocument();
    expect(within(table).getByText("ACTIVE")).toBeInTheDocument();
  });

  it("revokes an active session", async () => {
    const user = userEvent.setup();
    renderRoute("/sessions");

    const table = await screen.findByRole("table");
    const row = within(table).getByText("ada@example.com").closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Revoke" }));

    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Revoke session" }));

    expect(await within(row as HTMLElement).findByText("EXPIRED")).toBeInTheDocument();
  });

  it("invalidates sessions for a user", async () => {
    const user = userEvent.setup();
    renderRoute("/sessions");

    await user.selectOptions(await screen.findByLabelText("Realm"), [TEST_REALM]);
    await user.click(screen.getByRole("button", { name: "Invalidate…" }));
    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("User"), [ADA_USER]);
    await user.click(within(dialog).getByRole("button", { name: "Invalidate" }));

    expect(await screen.findByText("Invalidated 2 sessions.")).toBeInTheDocument();
  });
});
