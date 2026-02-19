import { expect, type Page } from "@playwright/test";

export const e2eEmail = process.env.E2E_USER_EMAIL ?? "";
export const e2ePassword = process.env.E2E_USER_PASSWORD ?? "";

export const hasAuthEnv = Boolean(e2eEmail && e2ePassword);

export async function signIn(page: Page): Promise<void> {
  await page.goto("/auth?mode=signin");
  await page.getByPlaceholder("Email").first().fill(e2eEmail);
  await page.getByPlaceholder("Password").first().fill(e2ePassword);
  await page.getByRole("button", { name: "Sign in" }).first().click();

  await expect(page).toHaveURL(/\/dashboard/);
}
