import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createRoutes } from "@/app/routes";
import { createAppStore } from "@/app/store/store";
import { mockServer, resetMockDb } from "@/mocks/server";

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

/**
 * Full feature flow (ADR-0004): real route table, real store, real loaders,
 * API boundary mocked by the MSW server. The template later entities copy.
 */
beforeAll(() => mockServer.listen({ onUnhandledFrame: "error" }));
beforeEach(() => resetMockDb());
afterAll(() => mockServer.close());

const renderAt = (entry: string) => {
  const store = createAppStore();
  const router = createMemoryRouter(createRoutes(store), {
    initialEntries: [entry],
  });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return router;
};

describe("realms flow", () => {
  it("lists realms with key columns and paginates", async () => {
    const user = userEvent.setup();
    renderAt("/realms?limit=1");

    expect(
      await screen.findByRole("link", { name: "admin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Showing 1–1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Showing 2–2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "test" })).toBeInTheDocument();
  });

  it("creates a realm from the dialog", async () => {
    const user = userEvent.setup();
    renderAt("/realms");

    await user.click(
      await screen.findByRole("button", { name: "Create realm" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "acme");
    await user.click(within(dialog).getByRole("button", { name: "Generate" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Create realm" }),
    );

    expect(await screen.findByText("acme")).toBeInTheDocument();
  });

  it("shows the detail and saves an edit", async () => {
    const user = userEvent.setup();
    renderAt("/realms/11111111-1111-1111-1111-111111111111");

    expect(await screen.findByText("Session max lifetime")).toBeInTheDocument();
    expect(screen.getByText("Password policy")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit realm" }));
    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Name"));
    await user.type(within(dialog).getByLabelText("Name"), "test-renamed");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    expect(
      await screen.findByRole("heading", { name: "test-renamed" }),
    ).toBeInTheDocument();
  });

  it("shows the delete guard message", async () => {
    const user = userEvent.setup();
    renderAt("/realms/11111111-1111-1111-1111-111111111111");

    await user.click(
      await screen.findByRole("button", { name: "Delete realm" }),
    );
    const confirm = await screen.findByRole("alertdialog");
    await user.click(
      within(confirm).getByRole("button", { name: "Delete realm" }),
    );

    expect(
      await screen.findByText("realm still has clients or users"),
    ).toBeInTheDocument();
  });
});
