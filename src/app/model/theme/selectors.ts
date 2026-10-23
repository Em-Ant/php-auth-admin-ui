import type { ThemeState } from "./slice";

interface StateWithTheme {
  theme: ThemeState;
}

export const selectThemeMode = (state: StateWithTheme) => state.theme.mode;

export const selectIsDark = (state: StateWithTheme) =>
  state.theme.mode === "dark";
