import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows both seeded demo avatars", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Maya/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Leo/ })).toBeVisible();
  });

  test("clicking an avatar navigates to its chat page", async ({ page, request }) => {
    const res = await request.get("http://localhost:8000/api/avatars/demo");
    const avatars = await res.json();
    const maya = avatars.find((a: { name: string }) => a.name === "Maya");

    await page.goto("/");
    await page.getByRole("link", { name: /Maya/ }).click();
    await page.waitForURL(`**/avatar/${maya.id}`);
    await expect(page.getByTestId("chat-input")).toBeVisible();
  });
});
