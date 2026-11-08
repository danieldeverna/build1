import { expect, test } from "@playwright/test";

test("dashboard and calendar navigation", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible();
  await page.getByRole("link", { name: /Calendar Your week/ }).click();
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await page.getByRole("button", { name: "Month" }).click();
  await expect(page.getByText("Mon", { exact: true })).toBeVisible();
});

test("task creation and category filtering", async ({ page }) => {
  await page.goto("/work");
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByLabel("Title").fill("Send application follow-up");
  await page.getByLabel("Category").selectOption("recruiting");
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByRole("tab", { name: /Recruiting/ }).click();
  await expect(page.getByText("Send application follow-up")).toBeVisible();
});
