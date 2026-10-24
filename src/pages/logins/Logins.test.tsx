import { screen, waitFor, within } from "@testing-library/react";
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

describe("logins flow", () => {
  it("lists logins with statuses", async () => {
    renderRoute("/logins");

    const table = await screen.findByRole("table");
    expect(within(table).getByText("admin-ui")).toBeInTheDocument();
    expect(within(table).getByText("PENDING")).toBeInTheDocument();
  });

  it("deletes a login", async () => {
    const user = userEvent.setup();
    renderRoute("/logins");

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    const target = rows.find((row) => within(row).queryByText("admin-ui") !== null);
    expect(target).toBeDefined();
    await user.click(within(target as HTMLElement).getByRole("button", { name: "Delete" }));

    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete login" }));

    await waitFor(() =>
      expect(within(screen.getByRole("table")).queryByText("admin-ui")).not.toBeInTheDocument(),
    );
  });
});
