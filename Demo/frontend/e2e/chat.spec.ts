import { test, expect } from "@playwright/test";
import { getDemoAvatar } from "./fixtures";
import { sendAndAwaitReply } from "./chat-helpers";

test.describe("Maya (Marketing) chat", () => {
  test.beforeEach(async ({ page, request }) => {
    const maya = await getDemoAvatar(request, "Maya");
    await page.goto(`/avatar/${maya.id}`);
    await expect(page.getByTestId("chat-input")).toBeVisible();
    await expect(page.getByText("Aero Retail", { exact: false })).toBeVisible();
  });

  test("product search tool is invoked for a shopping question", async ({ page }) => {
    const reply = await sendAndAwaitReply(page, "I need a laptop for video editing under 80000 rupees");
    expect(reply.toLowerCase()).toMatch(/laptop|aerobook|₹|rupee/);
  });

  test("FAQ answers are grounded in the knowledge base with a cited source", async ({ page }) => {
    const reply = await sendAndAwaitReply(page, "What is your return policy?");
    expect(reply.toLowerCase()).toMatch(/return|15 day/);
    expect(reply.toLowerCase()).toContain("source");
  });

  test("asking for a human escalates the conversation", async ({ page }) => {
    const reply = await sendAndAwaitReply(page, "I want to talk to a human agent right now");
    expect(reply.toLowerCase()).toMatch(/human|agent|connect|team/);
  });
});

test.describe("Leo (Real Estate) chat", () => {
  test.beforeEach(async ({ page, request }) => {
    const leo = await getDemoAvatar(request, "Leo");
    await page.goto(`/avatar/${leo.id}`);
    await expect(page.getByTestId("chat-input")).toBeVisible();
    await expect(page.getByText("Prime Realty", { exact: false })).toBeVisible();
  });

  test("property search tool responds to a requirement", async ({ page }) => {
    const reply = await sendAndAwaitReply(page, "I'm looking for a 3BHK apartment");
    expect(reply.length).toBeGreaterThan(20);
  });

  test("site visit scheduling is offered", async ({ page }) => {
    const reply = await sendAndAwaitReply(page, "Can I schedule a site visit?");
    expect(reply.toLowerCase()).toMatch(/visit|schedule|appointment/);
  });
});
