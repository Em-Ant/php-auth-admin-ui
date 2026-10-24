import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createRoutes } from "@/app/routes";
import { createAppStore } from "@/app/store/store";

/**
 * Integration-test entry: a fresh store plus the real route table, so the
 * real loaders, thunks, selectors and components run. Each test file mocks
 * `@/app/bootstrap`, `@/shared/auth` and `@/shared/config` the same way and
 * serves the API boundary with `mockServer`.
 */
export const renderRoute = (entry: string) => {
  const store = createAppStore();
  const router = createMemoryRouter(createRoutes(store), {
    initialEntries: [entry],
  });
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { store, router };
};
