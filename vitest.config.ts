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
      // Integration tests drive full feature flows through the real route
      // table and MSW; several sequential interactions can exceed the 5s
      // default under load.
      testTimeout: 15000,
      coverage: {
        provider: "v8",
        reporter: ["text", "lcovonly"],
        include: ["src"],
        exclude: ["src/**/*.stories.{ts,tsx}"],
      },
    },
  }),
);
