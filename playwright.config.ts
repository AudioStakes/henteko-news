import { defineConfig, devices } from "@playwright/test";

const runningInCi = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./tests",
  testIgnore: process.env["RUN_SPEECH_SMOKE"] === "1" ? [] : ["**/speech.spec.ts"],
  timeout: 30_000,
  forbidOnly: true,
  fullyParallel: true,
  workers: runningInCi ? 2 : 4,
  retries: runningInCi ? 1 : 0,
  reporter: runningInCi ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4175",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: ["**/speech.spec.ts"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: ["**/speech.spec.ts"],
    },
    {
      name: "android",
      use: { ...devices["Pixel 7"] },
      testIgnore: ["**/speech.spec.ts"],
    },
    {
      name: "iphone",
      use: { ...devices["iPhone 13"] },
      testIgnore: ["**/speech.spec.ts"],
    },
    {
      name: "ipad",
      use: { ...devices["iPad (gen 7)"] },
      testIgnore: ["**/speech.spec.ts"],
    },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4175 --strictPort",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
