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

const TEST_REALM = "11111111-1111-1111-1111-111111111111";

describe("debug", () => {
  it("traces delete navigation", async () => {
    const user = userEvent.setup();
    const { router } = renderRoute("/clients");

    await user.click(await screen.findByRole("button", { name: "Create client" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "acme-app");
    await user.type(within(dialog).getByLabelText("Redirect URI pattern"), "https://acme.example/*");
    await user.selectOptions(within(dialog).getByLabelText("Realm"), [TEST_REALM]);
    await user.click(within(dialog).getByRole("button", { name: "Create client" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(await screen.findByRole("link", { name: "acme-app" }));
    await screen.findByRole("heading", { name: "acme-app" });
    await user.click(screen.getByRole("button", { name: "Delete client" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete client" }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/clients"),
    );
    await waitFor(
      () => expect(screen.queryByRole("link", { name: "spa" })).not.toBeNull(),
      { timeout: 4000 },
    );
    // eslint-disable-next-line no-console
    console.log(
      "LINKS:",
      screen.getAllByRole("link").map((a) => a.textContent).join(" | "),
    );
    expect(true).toBe(true);
  });
});
