import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./src/e2e",
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     */
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/e2e/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: "setup db",
      testMatch: /global\.setup\.ts$/,
      teardown: "cleanup db",
    },
    {
      name: "cleanup db",
      testMatch: /global\.teardown\.ts$/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup db"],
    },
    // Additional browser configurations can be added here in the future
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
