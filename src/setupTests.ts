import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// jsdom does not implement matchMedia; the sidebar breakpoint hook needs it.
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;

// Clean up the DOM and restore API spies after each test case.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
