import { expect, test } from "@playwright/test";
import { hasAuthEnv, signIn } from "./utils";

test("[full] wishlists page supports create list, add item and reserve", async ({ page }) => {
  test.skip(!hasAuthEnv, "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

  await signIn(page);
  await page.goto("/dashboard/wishlists");
  await expect(page.getByRole("heading", { name: "Вишлисты" })).toBeVisible();

  const wishlistTitle = `E2E Wishlist ${Date.now()}`;
  const itemTitle = `E2E Gift ${Date.now()}`;

  await page.getByTestId("wishlist-create-button").first().click();
  await page.getByLabel("Название").first().fill(wishlistTitle);
  await page.getByRole("button", { name: "Сохранить" }).click();

  const wishlistCard = page.locator("section,div,article").filter({ hasText: wishlistTitle }).first();
  await expect(wishlistCard).toBeVisible();

  await wishlistCard.getByTestId("wishlist-add-item-button").click();
  await page.getByLabel("Название").last().fill(itemTitle);
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(wishlistCard.getByText(itemTitle)).toBeVisible();
  await wishlistCard.getByRole("button", { name: "Резерв" }).first().click();
  await expect(wishlistCard.getByText(/Зарезервировано/i)).toBeVisible();
});
