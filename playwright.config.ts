import { defineConfig, devices } from "@playwright/test";

const runningInCi = Boolean(process.env["CI"]);
const speechTestIgnore = process.env["RUN_SPEECH_SMOKE"] === "1" ? [] : ["**/speech.spec.ts"];
const mobileLayoutTest = "**/layout/mobile-viewport.spec.ts";

export default defineConfig({
  testDir: "./tests",
  testIgnore: speechTestIgnore,
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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [...speechTestIgnore, mobileLayoutTest],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: ["**/speech.spec.ts", mobileLayoutTest],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: ["**/speech.spec.ts", mobileLayoutTest],
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
      testIgnore: ["**/speech.spec.ts", mobileLayoutTest],
    },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4175 --strictPort",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
