import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MESSAGES } from '../../backend/src/messages';

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test/reset', { data: {} });
  expect(res.ok()).toBe(true);
});

test('5 wrong passwords throttle further attempts, recorded in the audit log', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await loginPage.login('john', 'wrongpass');
    await expect(loginPage.errorMessage).toHaveText(MESSAGES.INVALID_CREDENTIALS);
  }

  await loginPage.login('john', 'wrongpass');
  await expect(loginPage.errorMessage).toHaveText(MESSAGES.TOO_MANY_ATTEMPTS);

  // These failed attempts don't touch the browser's pre-authenticated
  // storageState session (the throttle only gates the login endpoint, not
  // existing sessions), so the audit trail is viewable immediately.
  await page.goto('/activity');
  await expect(page.getByTestId('audit-list')).toContainText('Failed login attempt');
});

// Isolated from the shared storageState session: every other spec in this
// project reuses one authenticated session cookie (captured once by
// auth.setup.ts), so actually expiring it here would 401 every test that
// runs afterwards. This test logs in independently in its own empty
// browser context, and fast-forwards only ITS OWN session via the
// test-only /api/test/expire-session endpoint (see backend/src/routes/test.ts)
// instead of waiting out a shortened TEST_IDLE_MS, which would carry the
// same shared-session risk.
test.describe('session idle timeout', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('an idle-expired session redirects to login with the session-expired banner', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('john', 'Password123');
    await expect(page).toHaveURL('/transfer');

    // TransferPage's mount-time dashboard fetches (getAccounts/getTransactions/
    // getBeneficiaries/getLimits) are still in flight right after the URL
    // changes. Each one refreshes lastActivity when it lands. Without waiting
    // for them to fully settle, one can land AFTER expire-session below and
    // overwrite the just-forced lastActivity=0 back to a valid, non-idle value.
    await page.waitForLoadState('networkidle');

    // page.request (not the standalone `request` fixture) shares this test's
    // browser-context cookie jar, so it carries the session cookie the login
    // above just set.
    const expireRes = await page.request.post('/api/test/expire-session');
    expect(expireRes.ok()).toBe(true);

    await page.goto('/transfer');

    await expect(page).toHaveURL('/');
    await expect(loginPage.infoBanner).toHaveText(MESSAGES.SESSION_EXPIRED);
  });
});
