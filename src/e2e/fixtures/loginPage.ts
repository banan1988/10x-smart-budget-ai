import { Page } from '@playwright/test';
import { BasePage } from './basePage';

export class LoginPage extends BasePage {
  readonly emailInput = this.page.locator('input[type="email"]');
  readonly passwordInput = this.page.locator('input[type="password"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly errorMessage = this.page.locator('[role="alert"]');

  async goto() {
    await super.goto('/login');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

