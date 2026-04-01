import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // UC 간 순서 보장
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,

  outputDir: "./test-results",

  use: {
    baseURL: "http://localhost:4100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
