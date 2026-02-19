import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[full] notes page supports create note and open editor", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.goto("/dashboard/notes");
  await expect(page.getByRole("heading", { name: "Заметки" })).toBeVisible();

  await page.getByRole("button", { name: "Создать заметку" }).click();
  await expect(page).toHaveURL(/\/dashboard\/notes\/.+/);
  await expect(page.getByLabel("Заголовок")).toBeVisible();
});
