import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e",
  timeout: 30000,
  use: {
    baseURL: "https://csv.freeq.one",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
