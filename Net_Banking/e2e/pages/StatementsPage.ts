import { Page, Locator } from '@playwright/test';

export class StatementsPage {
  readonly page: Page;
  readonly accountSelect: Locator;
  readonly fromDate: Locator;
  readonly toDate: Locator;
  readonly downloadButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountSelect = page.locator('#statementAccount');
    this.fromDate = page.locator('#statementFrom');
    this.toDate = page.locator('#statementTo');
    this.downloadButton = page.getByTestId('download-csv');
  }

  async goto(): Promise<void> {
    await this.page.goto('/statements');
  }
}
