import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  optimizeDeps: {
    exclude: ["@/wasm/password_strength_wasm.js"],
  },
  // Enable WASM support
  assetsInclude: ["**/*.wasm"],
});
