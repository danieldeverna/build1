import { expect, test } from "@playwright/test";

test("dashboard and calendar navigation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Daniel/ })).toBeVisible();
  await page.getByRole("link", { name: /Calendar Your week/ }).click();
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await page.getByRole("button", { name: "Month" }).click();
  await expect(page.getByText("Mon", { exact: true })).toBeVisible();
});

test("desktop dashboard keeps every tile above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Calendar Your week/ })).toBeVisible();

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(pageHeight).toBeLessThanOrEqual(900);
});

test("task creation and category filtering", async ({ page }) => {
  await page.goto("/work");
  await page.getByRole("button", { name: "Add task" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Send application follow-up");
  await dialog.getByLabel("Category").selectOption("recruiting");
  await dialog.getByRole("button", { name: "Add task" }).click();
  await page.getByRole("tab", { name: /Recruiting/ }).click();
  await expect(page.getByText("Send application follow-up")).toBeVisible();
});

test("fitness planner presents and tracks the adaptive week", async ({ page }) => {
  await page.goto("/fitness");
  await expect(page.getByRole("heading", { name: "Fitness planner" })).toBeVisible();
  await expect(page.getByText("Your week, trained around your life.")).toBeVisible();
  await expect(page.getByText("Upper Push", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Upper Accessory", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("dialog", { name: "Why are you skipping?" })).toBeVisible();
  await page.getByRole("button", { name: "Too much academic work" }).click();
  await expect(page.getByRole("dialog", { name: "Why are you skipping?" })).toBeHidden();
});

test("weather page presents the Georgetown live forecast", async ({ page }) => {
  await page.goto("/weather");
  await expect(page.getByRole("heading", { name: "Georgetown, D.C." })).toBeVisible();
  const liveForecast = page.getByText(/Live · updated/);
  const outageState = page.getByRole("heading", { name: "Live weather is temporarily unavailable" });
  await expect(liveForecast.or(outageState)).toBeVisible();
  if (await liveForecast.isVisible()) {
    await expect(page.getByRole("heading", { name: "Throughout the day" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The week ahead" })).toBeVisible();
  }
});
