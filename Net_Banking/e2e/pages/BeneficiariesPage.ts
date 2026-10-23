import { Page, Locator } from '@playwright/test';

export class BeneficiariesPage {
  readonly page: Page;
  readonly accountInput: Locator;
  readonly nicknameInput: Locator;
  readonly addButton: Locator;
  readonly errorMessage: Locator;
  readonly beneficiaryList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountInput = page.locator('#benAccount');
    this.nicknameInput = page.locator('#benNickname');
    this.addButton = page.getByRole('button', { name: 'Add Beneficiary' });
    this.errorMessage = page.locator('.error');
    this.beneficiaryList = page.getByTestId('beneficiary-list');
  }

  async goto(): Promise<void> {
    await this.page.goto('/beneficiaries');
  }

  async add(accountNo: string, nickname: string): Promise<void> {
    await this.accountInput.fill(accountNo);
    await this.nicknameInput.fill(nickname);
    await this.addButton.click();
  }

  removeButton(nickname: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${nickname}` });
  }
}
