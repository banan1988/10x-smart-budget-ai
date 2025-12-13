import { Locator, Page } from "@playwright/test";
import { BasePage } from "./basePage";
import { EmailField, PasswordField, ErrorAlert, NavigationLinks } from "./loginFormCard";

/**
 * LoginPage - Page Object Model for Login functionality
 * Uses dedicated component classes following POM pattern
 * Maintains backward compatibility with Locator-based tests
 */
export class LoginPage extends BasePage {
  // Component classes
  emailField: EmailField;
  passwordField: PasswordField;
  errorAlert: ErrorAlert;
  navigationLinks: NavigationLinks;

  // Locators
  emailInput: Locator;
  passwordInput: Locator;
  submitButton: Locator;
  passwordToggleButton: Locator;
  forgotPasswordLink: Locator;
  registerLink: Locator;
  errorMessage: Locator;
  generalErrorAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize component classes
    this.emailField = new EmailField(page);
    this.passwordField = new PasswordField(page);
    this.errorAlert = new ErrorAlert(page);
    this.navigationLinks = new NavigationLinks(page);

    // Initialize locators
    this.emailInput = page.locator('[data-testid="login-email-input"]');
    this.passwordInput = page.locator('[data-testid="login-password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit-button"]');
    this.passwordToggleButton = page.locator('[data-testid="login-password-toggle"]');
    this.forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');
    this.registerLink = page.locator('[data-testid="login-register-link"]');
    this.errorMessage = page.locator('[data-testid="login-error-alert"]').first();
    this.generalErrorAlert = page.locator('[data-testid="login-error-alert"]').first();
  }

  async goto(): Promise<void> {
    await super.goto("/login");
    await this.page.waitForLoadState("networkidle").catch(() => {
      return this.page.waitForLoadState("domcontentloaded");
    });
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailField.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordField.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.errorAlert.getMessage();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  async clearEmail(): Promise<void> {
    await this.emailField.clear();
  }

  async clearPassword(): Promise<void> {
    await this.passwordField.clear();
  }

  async getEmailErrorElement(): Locator {
    return this.page.locator('[data-testid="login-email-error"]');
  }

  async getPasswordErrorElement(): Locator {
    return this.page.locator('[data-testid="login-password-error"]');
  }
}
