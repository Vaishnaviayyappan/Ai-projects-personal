import { test, expect } from "@playwright/test";
import { getDemoAvatar } from "./fixtures";

const MARKETING_LOGIN = { email: "marketing@demo.com", password: "Demo@1234" };

test.describe("Admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', MARKETING_LOGIN.email);
    await page.fill('input[type="password"]', MARKETING_LOGIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin");
  });

  test("dashboard shows real stat cards", async ({ page }) => {
    await expect(page.getByText("Conversations", { exact: false })).toBeVisible();
    await expect(page.getByText("Escalation Rate", { exact: false })).toBeVisible();
  });

  test("avatars list shows seeded avatars and has no leftover Simli UI", async ({ page }) => {
    await page.goto("/admin/avatars");
    await expect(page.getByText("Maya", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/simli/i)).toHaveCount(0);
  });

  test("avatar config page loads without Simli references", async ({ page, request }) => {
    const maya = await getDemoAvatar(request, "Maya");
    await page.goto(`/admin/avatars/${maya.id}`);
    await expect(page.getByRole("heading", { name: "Persona" })).toBeVisible();
    await expect(page.getByText(/simli/i)).toHaveCount(0);
  });

  test("knowledge base lists the seeded FAQ", async ({ page }) => {
    await page.goto("/admin/knowledge");
    await expect(page.getByText(/FAQ/i).first()).toBeVisible();
  });

  test("conversations, escalations, leads, and appointments pages all load", async ({ page }) => {
    for (const path of ["/admin/conversations", "/admin/escalations", "/admin/leads", "/admin/appointments"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
    }
  });
});
