import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[full] shopping page supports add and check item", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.goto("/dashboard/shopping");
  await expect(page.getByRole("heading", { name: "Покупки" })).toBeVisible();

  const itemTitle = `E2E Milk ${Date.now()}`;
  await page.getByPlaceholder("Добавить товар...").fill(itemTitle);
  await page.getByRole("button", { name: "Добавить" }).click();

  const row = page.locator("li").filter({ hasText: itemTitle }).first();
  await expect(row).toBeVisible();
  await row.locator('input[type="checkbox"]').check();
});
