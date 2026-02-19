import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[smoke] finances page renders summary and filters", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.goto("/dashboard/finances");

  await expect(page.getByRole("heading", { name: "Финансы" })).toBeVisible();
  await expect(page.getByText("Доходы за месяц")).toBeVisible();
  await expect(page.getByText("Расходы за месяц")).toBeVisible();
  await expect(page.getByText("Баланс месяца")).toBeVisible();
  await expect(page.getByRole("button", { name: "Применить фильтры" })).toBeVisible();
});
