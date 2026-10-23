import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'html',
  globalSetup: require.resolve('./global-setup'),
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace backend',
      url: 'http://localhost:4000/api/accounts',
      cwd: '..',
      reuseExistingServer: !process.env.CI,
      env: {
        ENABLE_TEST_ENDPOINTS: '1',
        PORT: '4000',
      },
    },
    {
      command: 'npm run dev --workspace frontend',
      url: 'http://localhost:3000',
      cwd: '..',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
