import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[smoke] family page has permissions entrypoint for admin", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.goto("/dashboard/family");
  await expect(page.getByRole("heading", { name: "Семья" })).toBeVisible();

  const permissionButtons = page.getByRole("button", { name: "Права" });
  await expect(permissionButtons.first()).toBeVisible();
});

test("[full] user without calendar permission cannot open calendar route", async ({ page }) => {
  test.skip(true, "Scenario requires dedicated read-only test user with restricted permissions");

  await signIn(page);
  await page.goto("/dashboard/calendar");
  await expect(page).toHaveURL(/\/dashboard(\/?$)/);
});
