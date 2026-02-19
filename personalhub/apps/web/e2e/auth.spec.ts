import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[smoke] auth screen renders sign in/sign up modes", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText("PersonalHub")).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign up|Регистрация/i })).toBeVisible();
});

test("[full] user can sign in and sign out", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.getByRole("button", { name: /@/ }).click();
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/auth/);
});
