import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { chromium, expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.resolve(__dirname, "../dist/extension");
const fixturePath = path.resolve(__dirname, "./fixtures/plain-inputs.html");

test("popup toggle enables Assamese typing for the current site textarea", async () => {
  const fixtureHtml = await fs.readFile(fixturePath, "utf8");
  const routedUrl = "https://bornomala.test/fixture";
  const userDataDir = path.resolve(__dirname, "../.tmp-playwright/user-data");
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    const serviceWorker = context.serviceWorkers()[0] ?? await context.waitForEvent("serviceworker");
    const extensionId = serviceWorker.url().split("/")[2] ?? "";
    const page = await context.newPage();
    await page.route("https://bornomala.test/**", async (route) => {
      await route.fulfill({
        body: fixtureHtml,
        contentType: "text/html"
      });
    });

    await page.goto(routedUrl);
    await page.locator("#plain-textarea").click();
    await page.keyboard.type("kha");
    await expect(page.locator("#plain-textarea")).toHaveValue("kha");

    const popup = await context.newPage();
    await popup.goto(
      `chrome-extension://${extensionId}/popup.html?tabUrl=${encodeURIComponent(page.url())}`
    );
    await popup.getByRole("button", { name: "Enable Bornomala on this site" }).click();

    await page.locator("#plain-textarea").press("Meta+A");
    await page.keyboard.type("kha");
    await expect(page.locator("#plain-textarea")).toHaveValue("খা");
  } finally {
    await context.close();
  }
});
