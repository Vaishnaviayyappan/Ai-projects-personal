import { test, expect } from '@playwright/test';
import { TransferPage } from '../pages/TransferPage';
import { MESSAGES } from '../../backend/src/messages';

interface LimitsDto {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
}

test('using up to 71% of the daily limit shows the amber meter state', async ({ page, request }) => {
  const resetRes = await request.post('/api/test/reset', {
    data: { balanceOverride: { account: 'SB1001', balance: 1000000 } },
  });
  expect(resetRes.ok()).toBe(true);

  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '355000', 'Big chunk');
  await transferPage.submit();

  await expect(transferPage.otpModal).toBeVisible();
  await transferPage.fillOtp('123456');
  await transferPage.otpConfirmButton.click();
  await expect(transferPage.successMessage).toContainText('Transfer Successful');

  await expect(transferPage.limitMeter).toHaveAttribute('aria-valuenow', '71');
  await expect(transferPage.limitMeter).toHaveClass(/limit-meter-amber/);

  const limitsRes = await request.get('/api/limits?account=SB1001');
  const limits = (await limitsRes.json()) as LimitsDto;
  expect(limits.usedToday).toBe(355000);
});

test('exceeding the daily limit shows the exact error message', async ({ page, request }) => {
  const resetRes = await request.post('/api/test/reset', {
    data: { balanceOverride: { account: 'SB1001', balance: 1000000 } },
  });
  expect(resetRes.ok()).toBe(true);

  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '400000', 'Near the limit');
  await transferPage.submit();
  await expect(transferPage.otpModal).toBeVisible();
  await transferPage.fillOtp('123456');
  await transferPage.otpConfirmButton.click();
  await expect(transferPage.successMessage).toContainText('Transfer Successful');

  await transferPage.fillTransfer('SB1001', 'CA2001', '150000', 'Over the top');
  await transferPage.submit();

  await expect(transferPage.errorMessage).toHaveText(MESSAGES.DAILY_LIMIT_EXCEEDED);
});
