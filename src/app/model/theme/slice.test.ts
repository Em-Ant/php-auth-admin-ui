import { describe, expect, it } from "vitest";
import type { ThemeState } from "./slice";
import { setTheme, themeReducer, toggleTheme } from "./slice";

describe("theme slice", () => {
  it("defaults to dark mode", () => {
    const state = themeReducer(undefined, { type: "@@INIT" });
    expect(state.mode).toBe("dark");
  });

  it("toggles between dark and light", () => {
    const initial: ThemeState = { mode: "dark" };
    const light = themeReducer(initial, toggleTheme());
    expect(light.mode).toBe("light");
    const dark = themeReducer(light, toggleTheme());
    expect(dark.mode).toBe("dark");
  });

  it("sets an explicit mode", () => {
    const initial: ThemeState = { mode: "dark" };
    const light = themeReducer(initial, setTheme("light"));
    expect(light.mode).toBe("light");
  });
});
