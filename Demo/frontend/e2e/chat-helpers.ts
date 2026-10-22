import { Page, expect } from "@playwright/test";

/** Sends a chat message and waits for a new assistant reply to land in the transcript.
 *  Real LLM + RAG + tool-call turns take real seconds, so this polls rather than
 *  waiting on a fixed delay. Returns the new assistant message's text content. */
export async function sendAndAwaitReply(page: Page, text: string, timeoutMs = 90_000): Promise<string> {
  const assistantMessages = page.getByTestId("chat-message").and(page.locator('[data-role="assistant"]'));
  const before = await assistantMessages.count();

  await page.getByTestId("chat-input").fill(text);
  await page.getByTestId("chat-send").click();

  await expect(assistantMessages).toHaveCount(before + 1, { timeout: timeoutMs });
  return assistantMessages.last().innerText();
}
