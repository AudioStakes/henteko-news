import { expect, test } from "@playwright/test";
import { pressTab } from "./helpers";

test("the standalone 404 page loads no app assets and returns home by keyboard", async ({
  page,
  browserName,
}) => {
  const resources: string[] = [];
  page.on("request", (request) => resources.push(request.resourceType()));
  await page.goto("/404.html");
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("ページが見つかりません");
  await expect(page.locator("script")).toHaveCount(0);
  expect(resources).toStrictEqual(["document"]);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator("html").evaluate((element) => {
    element.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const home = page.getByRole("link", { name: "トップへ戻る" });
  await expect(home).toHaveAttribute("href", "/");
  await pressTab(page, browserName);
  await expect(home).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "はじめる" })).toBeVisible();
});
