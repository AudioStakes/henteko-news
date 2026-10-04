import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { pwaBuildPlugin } from "./scripts/pwa-build.mjs";

export default defineConfig({
  plugins: [react(), pwaBuildPlugin()],
  optimizeDeps: { exclude: ["onnxruntime-web"] },
  test: {
    allowOnly: false,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
