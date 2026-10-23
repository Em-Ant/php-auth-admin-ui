import { useCallback, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { selectThemeMode } from "./selectors";
import { setTheme, type ThemeMode, toggleTheme } from "./slice";

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    try {
      window.localStorage.setItem("theme", mode);
    } catch {
      // Ignore storage write failures; the in-memory state still applies.
    }
  }, [mode]);

  const toggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      dispatch(setTheme(next));
    },
    [dispatch],
  );

  return {
    mode,
    isDark: mode === "dark",
    toggle,
    setTheme: setMode,
  };
};
