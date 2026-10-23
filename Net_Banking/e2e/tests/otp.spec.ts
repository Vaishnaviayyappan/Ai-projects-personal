import { test, expect } from '@playwright/test';
import { TransferPage } from '../pages/TransferPage';
import { MESSAGES } from '../../backend/src/messages';

interface AccountDto {
  account_no: string;
  balance_rupees: number;
}

interface TransactionDto {
  txn_ref: string;
  amount: number;
}

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test/reset', { data: {} });
  expect(res.ok()).toBe(true);
});

test('a transfer over ₹10,000 opens the OTP modal instead of completing directly', async ({ page }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '15000', 'Big rent');
  await transferPage.submit();

  await expect(transferPage.otpModal).toBeVisible();
  await expect(transferPage.successMessage).toHaveCount(0);
});

test('wrong OTP shows "Invalid OTP" and does not debit', async ({ page, request }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '15000', 'Big rent');
  await transferPage.submit();
  await expect(transferPage.otpModal).toBeVisible();

  await transferPage.fillOtp('000000');
  await transferPage.otpConfirmButton.click();

  await expect(transferPage.otpError).toHaveText(MESSAGES.INVALID_OTP);

  const accountsRes = await request.get('/api/accounts');
  const accounts = (await accountsRes.json()) as AccountDto[];
  const sb1001 = accounts.find((account) => account.account_no === 'SB1001');
  expect(sb1001?.balance_rupees).toBe(50000);
});

test('correct OTP completes the transfer with exactly one transaction', async ({ page, request }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '15000', 'Big rent');
  await transferPage.submit();
  await expect(transferPage.otpModal).toBeVisible();

  await transferPage.fillOtp('123456');
  await transferPage.otpConfirmButton.click();

  await expect(transferPage.otpModal).toHaveCount(0);
  await expect(transferPage.successMessage).toContainText('Transfer Successful');

  const accountsRes = await request.get('/api/accounts');
  const accounts = (await accountsRes.json()) as AccountDto[];
  const sb1001 = accounts.find((account) => account.account_no === 'SB1001');
  const ca2001 = accounts.find((account) => account.account_no === 'CA2001');
  expect(sb1001?.balance_rupees).toBe(35000);
  expect(ca2001?.balance_rupees).toBe(35000);

  const transactionsRes = await request.get('/api/transactions');
  const transactions = (await transactionsRes.json()) as TransactionDto[];
  expect(transactions).toHaveLength(1);
  expect(transactions[0]?.amount).toBe(15000);
});

test('a ₹5,000 transfer completes directly without the OTP modal', async ({ page }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '5000', 'Small rent');
  await transferPage.submit();

  await expect(transferPage.successMessage).toContainText('Transfer Successful');
  await expect(transferPage.otpModal).toHaveCount(0);
});
