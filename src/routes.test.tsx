import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { createRoutes } from "./routes";
import { store } from "./store/store";

// React Router runs matched loaders in parallel. Bootstrap resolves
// asynchronously, so auth must not be queried before it finishes — otherwise
// the real keycloak-js wrapper throws "kc instance not initialized".
const state = vi.hoisted(() => ({ initialized: false }));

vi.mock("./bootstrap", () => {
  let promise: Promise<void> | null = null;
  return {
    default: () => {
      promise ??= new Promise<void>((resolve) => {
        setTimeout(() => {
          state.initialized = true;
          resolve();
        }, 10);
      });
      return promise;
    },
  };
});

vi.mock("./bootstrap/auth", () => ({
  isAuthenticated: async () => {
    if (!state.initialized) {
      throw new Error("auth: kc instance not initialized");
    }
    return false;
  },
  hasRole: async () => true,
  getUser: async () => ({ name: "admin", roles: ["admin"] }),
  getToken: async () => "test-token",
  forceTokenRefresh: async () => undefined,
}));

describe("routes", () => {
  it("waits for bootstrap before checking authentication", async () => {
    const router = createMemoryRouter(createRoutes(store), {
      initialEntries: ["/realms"],
    });

    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    );

    // Unauthenticated -> the admin guard redirects to the login screen.
    expect(await screen.findByText("Sign in to Admin UI")).toBeInTheDocument();
  });
});
