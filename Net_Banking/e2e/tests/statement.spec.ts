import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { TransferPage } from '../pages/TransferPage';
import { StatementsPage } from '../pages/StatementsPage';

interface AccountDto {
  account_no: string;
  balance_rupees: number;
}

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test/reset', { data: {} });
  expect(res.ok()).toBe(true);
});

test('downloaded statement CSV has correct row count, running balance, and final balance', async ({
  page,
  request,
}) => {
  const transferPage = new TransferPage(page);
  await transferPage.goto();
  await transferPage.fillTransfer('SB1001', 'CA2001', '10000', 'First transfer');
  await transferPage.submit();
  await expect(transferPage.successMessage).toContainText('Transfer Successful');

  await transferPage.fillTransfer('SB1001', 'CA2001', '5000', 'Second transfer');
  await transferPage.submit();
  await expect(transferPage.successMessage).toContainText('Transfer Successful');

  const statementsPage = new StatementsPage(page);
  await statementsPage.goto();
  await statementsPage.accountSelect.selectOption('SB1001');

  const [download] = await Promise.all([page.waitForEvent('download'), statementsPage.downloadButton.click()]);

  const csvPath = await download.path();
  expect(csvPath).not.toBeNull();
  const csvText = readFileSync(csvPath as string, 'utf-8');
  const lines = csvText.trim().split('\n');
  const [header, ...rows] = lines;

  expect(header).toBe('txn_ref,date,type,counterparty,remarks,amount,balance_after');
  expect(rows).toHaveLength(2);

  const parsed = rows.map((line) => {
    const [txnRef, , type, , , amount, balanceAfter] = line.split(',');
    return { txnRef, type, amount: Number(amount), balanceAfter: Number(balanceAfter) };
  });

  expect(parsed[0]?.type).toBe('DEBIT');
  expect(parsed[0]?.amount).toBe(10000);
  expect(parsed[0]?.balanceAfter).toBe(40000);

  expect(parsed[1]?.type).toBe('DEBIT');
  expect(parsed[1]?.amount).toBe(5000);
  expect(parsed[1]?.balanceAfter).toBe(35000);

  const accountsRes = await request.get('/api/accounts');
  const accounts = (await accountsRes.json()) as AccountDto[];
  const sb1001 = accounts.find((account) => account.account_no === 'SB1001');
  expect(sb1001?.balance_rupees).toBe(parsed[1]?.balanceAfter);
});
