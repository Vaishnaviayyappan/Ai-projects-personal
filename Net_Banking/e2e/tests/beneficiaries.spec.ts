import { test, expect } from '@playwright/test';
import { BeneficiariesPage } from '../pages/BeneficiariesPage';
import { TransferPage } from '../pages/TransferPage';
import { MESSAGES } from '../../backend/src/messages';

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test/reset', { data: {} });
  expect(res.ok()).toBe(true);
});

test('adding a beneficiary shows it in the saved list', async ({ page }) => {
  const beneficiariesPage = new BeneficiariesPage(page);
  await beneficiariesPage.goto();
  await beneficiariesPage.add('CA2001', 'Rent Landlord');

  await expect(beneficiariesPage.beneficiaryList).toContainText('Rent Landlord');
  await expect(beneficiariesPage.beneficiaryList).toContainText('CA2001');
});

test('a saved beneficiary appears as an option in the transfer toAccount dropdown', async ({ page }) => {
  const beneficiariesPage = new BeneficiariesPage(page);
  await beneficiariesPage.goto();
  await beneficiariesPage.add('CA2001', 'Rent Landlord');

  const transferPage = new TransferPage(page);
  await transferPage.goto();

  await expect(transferPage.toAccount.locator('option', { hasText: 'Rent Landlord — CA2001' })).toHaveCount(1);
  // Existing accounts remain untouched, so current specs' selectOption('CA2001') still resolves.
  await expect(transferPage.toAccount.locator('option[value="CA2001"]')).toHaveCount(2);
});

test('adding a duplicate beneficiary is rejected with the exact message', async ({ page }) => {
  const beneficiariesPage = new BeneficiariesPage(page);
  await beneficiariesPage.goto();
  await beneficiariesPage.add('CA2001', 'Rent Landlord');
  await expect(beneficiariesPage.beneficiaryList).toContainText('Rent Landlord');

  await beneficiariesPage.add('CA2001', 'Landlord Again');
  await expect(beneficiariesPage.errorMessage).toHaveText(MESSAGES.BENEFICIARY_ALREADY_ADDED);
});

test('deleting a beneficiary removes it from the list', async ({ page }) => {
  const beneficiariesPage = new BeneficiariesPage(page);
  await beneficiariesPage.goto();
  await beneficiariesPage.add('CA2001', 'Rent Landlord');
  await expect(beneficiariesPage.beneficiaryList).toContainText('Rent Landlord');

  await beneficiariesPage.removeButton('Rent Landlord').click();
  await page.getByRole('button', { name: 'Yes' }).click();

  await expect(beneficiariesPage.beneficiaryList).not.toContainText('Rent Landlord');
});
