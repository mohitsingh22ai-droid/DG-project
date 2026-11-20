import { test, expect } from "@playwright/test";
import { TEST_USERS } from "./support/auth-helpers";

/**
 * Regression: signing in as admin through the real form must land on the
 * production console. (A route pre-loaded while signed out used to be reused,
 * leaving the form stuck on "Signed in, opening…".)
 */
test("admin signs in through the form and lands on the production console", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', TEST_USERS.admin.email);
  await page.fill('input[type="password"]', TEST_USERS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/production", { timeout: 30000 });
  await expect(page.locator("h1")).toContainText("Production");
});
