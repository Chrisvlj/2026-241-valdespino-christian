import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3001);
const apiUrl = process.env.VITE_API_URL ?? `http://127.0.0.1:${port}`;
const mongoUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/pollclass_e2e";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  outputDir: "./artifacts/test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "./artifacts/playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "on",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://127.0.0.1:5173",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: String(port),
      VITE_API_URL: apiUrl,
      MONGODB_URI: mongoUri,
    },
  },
});
