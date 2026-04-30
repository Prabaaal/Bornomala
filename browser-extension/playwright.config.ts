import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts$/,
  timeout: 60_000,
  fullyParallel: false,
  use: {
    headless: true
  }
});
