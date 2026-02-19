import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[full] tasks page supports create and status toggle", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.goto("/dashboard/tasks");
  await expect(page.getByRole("heading", { name: "Задачи" })).toBeVisible();

  const taskTitle = `E2E Task ${Date.now()}`;
  await page.getByRole("button", { name: "Добавить задачу" }).click();
  await page.getByLabel("Название").fill(taskTitle);
  await page.getByRole("button", { name: "Сохранить" }).click();

  const taskCard = page.locator("div,li,section,article").filter({ hasText: taskTitle }).first();
  await expect(taskCard).toBeVisible();
  await taskCard.locator('input[type="checkbox"]').check();
});
