import { test, expect } from '@playwright/test';
import { TransferPage } from '../pages/TransferPage';

interface AccountDto {
  account_no: string;
  type: string;
  customer: string;
  balance_rupees: number;
}

interface TransactionDto {
  txn_ref: string;
  from_account: string;
  to_account: string;
  amount: number;
  remarks: string | null;
  created_at: string;
}

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test/reset', { data: {} });
  expect(res.ok()).toBe(true);
});

test('happy path: SB1001 -> CA2001 10000 updates balances and records a transaction', async ({ page, request }) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '10000', 'Rent');
  await transferPage.submit();

  await expect(transferPage.successMessage).toContainText('Transfer Successful');
  const successText = (await transferPage.successMessage.textContent()) ?? '';
  const txnRefMatch = successText.match(/TXN\d{5}/);
  expect(txnRefMatch).not.toBeNull();
  const txnRef = txnRefMatch?.[0] ?? '';

  await expect(transferPage.balanceSB1001).toContainText('40,000');
  await expect(transferPage.balanceCA2001).toContainText('30,000');

  const accountsRes = await request.get('/api/accounts');
  const accounts = (await accountsRes.json()) as AccountDto[];
  const sb1001 = accounts.find((account) => account.account_no === 'SB1001');
  const ca2001 = accounts.find((account) => account.account_no === 'CA2001');
  expect(sb1001?.balance_rupees).toBe(40000);
  expect(ca2001?.balance_rupees).toBe(30000);

  const transactionsRes = await request.get('/api/transactions');
  const transactions = (await transactionsRes.json()) as TransactionDto[];
  const recorded = transactions.find((txn) => txn.txn_ref === txnRef);
  expect(recorded).toBeTruthy();
  expect(recorded?.amount).toBe(10000);
  expect(recorded?.from_account).toBe('SB1001');
  expect(recorded?.to_account).toBe('CA2001');
});
