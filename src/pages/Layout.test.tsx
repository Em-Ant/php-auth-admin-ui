import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/render";
import { Layout } from "./Layout";

const renderLayout = () =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="overview" element={<p>overview content</p>} />
      </Route>
    </Routes>,
    { route: "/overview" },
  );

describe("Layout", () => {
  it("renders the brand, the navigation and the routed content", () => {
    renderLayout();

    expect(screen.getByText("Admin UI")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute(
      "href",
      "/overview",
    );
    expect(screen.getByRole("link", { name: /realms/i })).toHaveAttribute(
      "href",
      "/realms",
    );
    expect(screen.getByText("overview content")).toBeInTheDocument();
  });
});
