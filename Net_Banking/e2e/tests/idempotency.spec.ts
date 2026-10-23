import { test, expect } from '@playwright/test';
import { TransferPage } from '../pages/TransferPage';

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

// Demo: comment out frontend/src/pages/TransferPage.tsx line 39
// (`if (submittingRef.current) return;` inside handleTransfer) to make this
// test fail live — without that guard, two rapid clicks fire two independent
// requests (two Idempotency-Keys) and produce two transaction rows / debits.
test('two rapid Transfer clicks produce exactly one transaction and one debit', async ({ page, request }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '1000', 'Rapid click test');

  await Promise.all([transferPage.transferButton.click(), transferPage.transferButton.click()]);

  await expect(transferPage.successMessage).toContainText('Transfer Successful');

  const accountsRes = await request.get('/api/accounts');
  const accounts = (await accountsRes.json()) as AccountDto[];
  const sb1001 = accounts.find((account) => account.account_no === 'SB1001');
  const ca2001 = accounts.find((account) => account.account_no === 'CA2001');
  expect(sb1001?.balance_rupees).toBe(49000);
  expect(ca2001?.balance_rupees).toBe(21000);

  const transactionsRes = await request.get('/api/transactions');
  const transactions = (await transactionsRes.json()) as TransactionDto[];
  expect(transactions).toHaveLength(1);
  expect(transactions[0]?.amount).toBe(1000);
});
