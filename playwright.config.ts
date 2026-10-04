import { defineConfig } from "@playwright/test";

const runningInCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./tests",
  testIgnore: process.env["RUN_SPEECH_SMOKE"] === "1" ? [] : ["**/speech.spec.ts"],
  timeout: 30_000,
  forbidOnly: true,
  fullyParallel: true,
  retries: runningInCi ? 1 : 0,
  reporter: runningInCi ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !runningInCi,
    timeout: 60_000,
  },
});
