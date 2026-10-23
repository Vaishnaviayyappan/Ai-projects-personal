import { Page, Locator } from '@playwright/test';

export class TransferPage {
  readonly page: Page;
  readonly fromAccount: Locator;
  readonly toAccount: Locator;
  readonly amount: Locator;
  readonly remarks: Locator;
  readonly transferButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly balanceSB1001: Locator;
  readonly balanceCA2001: Locator;
  readonly txnHistory: Locator;
  readonly otpModal: Locator;
  readonly otpConfirmButton: Locator;
  readonly otpError: Locator;
  readonly limitMeter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fromAccount = page.locator('#fromAccount');
    this.toAccount = page.locator('#toAccount');
    this.amount = page.locator('#amount');
    this.remarks = page.locator('#remarks');
    this.transferButton = page.getByRole('button', { name: 'Transfer' });
    this.successMessage = page.locator('.success');
    this.errorMessage = page.locator('.error');
    this.balanceSB1001 = page.getByTestId('balance-SB1001');
    this.balanceCA2001 = page.getByTestId('balance-CA2001');
    this.txnHistory = page.getByTestId('txn-history');
    this.otpModal = page.getByTestId('otp-modal');
    this.otpConfirmButton = page.getByTestId('otp-confirm');
    this.otpError = this.otpModal.locator('.error');
    this.limitMeter = page.getByTestId('limit-meter');
  }

  async goto(): Promise<void> {
    await this.page.goto('/transfer');
  }

  async fillTransfer(fromAccount: string, toAccount: string, amount: string, remarks: string): Promise<void> {
    await this.fromAccount.selectOption(fromAccount);
    await this.toAccount.selectOption(toAccount);
    await this.amount.fill(amount);
    await this.remarks.fill(remarks);
  }

  async submit(): Promise<void> {
    await this.transferButton.click();
  }

  otpDigit(index: number): Locator {
    return this.page.getByTestId(`otp-digit-${index}`);
  }

  async fillOtp(otp: string): Promise<void> {
    await this.otpDigit(0).fill(otp);
  }
}
