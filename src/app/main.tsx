import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { base, createRoutes } from "./routes";
import { setupAppListeners, store } from "./store";

import "./styles/index.css";

/**
 * `pnpm start:mock` sets VITE_MOCK=1: the MSW worker serves the admin API
 * from an in-memory store while OIDC login still hits the real backend.
 * The dynamic import keeps msw out of the production bundle.
 */
const enableMocking = async () => {
  if (import.meta.env.VITE_MOCK === "1") {
    const { worker } = await import("../mocks/browser");
    await worker.start({
      onUnhandledFrame: "bypass",
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    });
  }
};

const render = async () => {
  setupAppListeners();

  await enableMocking();

  const router = createBrowserRouter(createRoutes(store), base);

  const root = document.getElementById("root");

  if (!root) {
    throw new Error("root element not available");
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </React.StrictMode>,
  );
};

void render();
