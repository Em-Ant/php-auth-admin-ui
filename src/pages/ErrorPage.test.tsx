import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { ErrorPage } from "./ErrorPage";

describe("ErrorPage", () => {
  it("renders a recoverable screen when a route loader fails", async () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: <p>dashboard</p>,
        errorElement: <ErrorPage />,
        HydrateFallback: () => <p>loading</p>,
        loader: () => {
          throw new Error("backend unreachable");
        },
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("backend unreachable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to dashboard" }),
    ).toBeInTheDocument();
  });
});
