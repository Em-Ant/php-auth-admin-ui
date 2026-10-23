import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// package name drives the deployed base path (same-folder FTP deploy convention)
const pkgName = "admin-ui";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: `/${pkgName}/`,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
