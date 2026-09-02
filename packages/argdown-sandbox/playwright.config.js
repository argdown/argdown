import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "./node_modules/.cache/playwright-results",
  use: {
    baseURL: "http://127.0.0.1:4174/sandbox/",
    browserName: "chromium",
    headless: true
  },
  webServer: {
    command: "corepack yarn dev --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174/sandbox/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
