import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      css: false,
      setupFiles: ["./src/setupTests.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcovonly"],
        include: ["src"],
        exclude: ["src/**/*.stories.{ts,tsx}"],
      },
    },
  }),
);
