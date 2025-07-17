import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    this.errorMessage = page.locator('text=/error|invalid|wrong|incorrect/i');
    this.validationErrors = page.locator('text=/required|cannot be empty|email|password/i');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForTimeout(2000);
  }

  async submitEmptyForm() {
    await this.loginButton.click();
    await this.page.waitForTimeout(1000);
  }

  async isVisible() {
    return await this.emailInput.isVisible() && await this.passwordInput.isVisible();
  }

  async hasValidationErrors() {
    return await this.validationErrors.count() > 0;
  }

  async hasErrorMessage() {
    return await this.errorMessage.isVisible();
  }
}