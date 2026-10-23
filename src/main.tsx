import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router";
import { base, createRoutes } from "./routes";
import { setupAppListeners, store } from "./store";

import "./index.css";

setupAppListeners();

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
