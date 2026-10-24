import { fireEvent, screen, within } from "@testing-library/react";
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

describe("audit logs flow", () => {
  it("lists entries with action links", async () => {
    renderRoute("/audit-logs");

    expect(await screen.findByRole("link", { name: "user.create" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "client.create" })).toBeInTheDocument();
  });

  it("shows the entry detail", async () => {
    const user = userEvent.setup();
    renderRoute("/audit-logs");

    await user.click(await screen.findByRole("link", { name: "user.create" }));

    expect(await screen.findByText("Detail payload")).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();
  });

  it("refuses an unbounded purge and purges with a cutoff", async () => {
    const user = userEvent.setup();
    renderRoute("/audit-logs");

    await user.click(await screen.findByRole("button", { name: "Purge…" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Purge entries" }));

    expect(
      await within(dialog).findByText(/never be unbounded/),
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("Older than"), {
      target: { value: "2027-01-01" },
    });
    await user.click(within(dialog).getByRole("button", { name: "Purge entries" }));

    expect(await screen.findByText("Purged 3 entries.")).toBeInTheDocument();
    expect(await screen.findByText("No entries match these filters.")).toBeInTheDocument();
  });
});
