import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
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

describe("Layout dark mode", () => {
  it("defaults to dark mode and toggles it with the switch", async () => {
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByRole("switch", { name: /dark mode/i });
    expect(document.documentElement).toHaveClass("dark");
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(document.documentElement).toHaveClass("dark");
  });
});
