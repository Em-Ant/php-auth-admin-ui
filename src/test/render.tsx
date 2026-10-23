import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { type AppStore, createAppStore } from "@/app/store/store";

interface RenderWithProvidersOptions {
  /** Pass one store to assert against it after the interaction. */
  store?: AppStore;
  /** Initial router entry; component tests that do not use routes can ignore it. */
  route?: string;
}

/**
 * The default for component tests: a fresh store and a memory router.
 * Integration tests build their own `createMemoryRouter` so they can exercise
 * the real loaders.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { store = createAppStore(), route = "/" }: RenderWithProvidersOptions = {},
) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  );
