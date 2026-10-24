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

const ACTIVE_OFFLINE = "o0000000-0000-0000-0000-000000000001";

describe("offline sessions flow", () => {
  it("lists offline sessions with statuses", async () => {
    renderRoute("/offline-sessions");

    expect(await screen.findByRole("link", { name: "ada@example.com" })).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("EXPIRED")).toBeInTheDocument();
  });

  it("revokes a grant from the detail page", async () => {
    const user = userEvent.setup();
    renderRoute(`/offline-sessions/${ACTIVE_OFFLINE}`);

    expect(await screen.findByText("ACTIVE")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Revoke grant" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Revoke grant" }));

    expect(await screen.findByText("EXPIRED")).toBeInTheDocument();
  });
});
