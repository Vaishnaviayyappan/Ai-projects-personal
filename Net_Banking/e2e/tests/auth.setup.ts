import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const AUTH_FILE = 'playwright/.auth/user.json';

setup('authenticate as john', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('john', 'Password123');
  await page.waitForURL('/transfer');
  await page.context().storageState({ path: AUTH_FILE });
});
