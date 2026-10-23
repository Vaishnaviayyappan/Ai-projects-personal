import { test, expect } from '@playwright/test';
import { TransferPage } from '../pages/TransferPage';
import { MESSAGES } from '../../backend/src/messages';

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test/reset', { data: {} });
  expect(res.ok()).toBe(true);
});

test('amount <= 0 shows "Amount must be greater than zero"', async ({ page }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '-500', '');
  await transferPage.submit();

  await expect(transferPage.errorMessage).toHaveText(MESSAGES.AMOUNT_NOT_POSITIVE);
});

test('amount greater than balance shows "Insufficient Balance" (balance check fires before daily-limit check)', async ({
  page,
}) => {
  // Seed balance for SB1001 is 50000, well under the 500000 daily limit, so an
  // amount of 5000000 could only fail the balance check, not the limit check.
  // This proves the validation order: balance check runs before the limit check.
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '5000000', '');
  await transferPage.submit();

  await expect(transferPage.errorMessage).toHaveText(MESSAGES.INSUFFICIENT_BALANCE);
});

test('amount within balance but over the daily limit shows "Daily transfer limit exceeded"', async ({
  page,
  request,
}) => {
  const resetRes = await request.post('/api/test/reset', {
    data: { balanceOverride: { account: 'SB1001', balance: 2000000 } },
  });
  expect(resetRes.ok()).toBe(true);

  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '600000', '');
  await transferPage.submit();

  await expect(transferPage.errorMessage).toHaveText(MESSAGES.DAILY_LIMIT_EXCEEDED);
});
