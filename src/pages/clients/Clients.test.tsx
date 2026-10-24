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
const SPA_CLIENT = "c0000000-0000-0000-0000-000000000002";

describe("clients flow", () => {
  it("lists clients with type badges", async () => {
    renderRoute("/clients");

    expect(await screen.findByRole("link", { name: "admin-ui" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "spa" })).toBeInTheDocument();
    expect(screen.getAllByText("public")).toHaveLength(2);
  });

  it("creates and deletes a client", async () => {
    const user = userEvent.setup();
    renderRoute("/clients");

    await user.click(await screen.findByRole("button", { name: "Create client" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "acme-app");
    await user.type(within(dialog).getByLabelText("Redirect URI pattern"), "https://acme.example/*");
    await user.selectOptions(within(dialog).getByLabelText("Realm"), [TEST_REALM]);
    await user.click(within(dialog).getByRole("button", { name: "Create client" }));

    // Wait for the dialog to close so the row below is the settled one.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const created = await screen.findByRole("link", { name: "acme-app" });
    await user.click(created);

    // Gate on the detail heading: the URI text also exists on the list row.
    expect(await screen.findByRole("heading", { name: "acme-app" })).toBeInTheDocument();
    expect(screen.getByText("https://acme.example/*")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete client" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete client" }));

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "acme-app" })).not.toBeInTheDocument(),
    );
    expect(await screen.findByRole("link", { name: "spa" })).toBeInTheDocument();
  });

  it("adds a scope-role mapping on the detail page", async () => {
    const user = userEvent.setup();
    renderRoute(`/clients/${SPA_CLIENT}`);

    expect(await screen.findByText("profile")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add mapping" }));

    const dialog = await screen.findByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Scope"), ["openid"]);
    await user.selectOptions(
      within(dialog).getByLabelText("Role"),
      ["r0000000-0000-0000-0000-000000000003"],
    );
    await user.click(within(dialog).getByRole("button", { name: "Add mapping" }));

    const rows = await screen.findAllByText("openid");
    expect(rows.length).toBeGreaterThan(0);
  });
});
