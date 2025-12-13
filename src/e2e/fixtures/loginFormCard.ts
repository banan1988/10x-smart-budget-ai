import { Page, Locator } from "@playwright/test";

/**
 * FormField - Base class for form input fields
 * Encapsulates common field behavior (input, validation, error handling)
 */
export class FormField {
  protected locator: Locator;
  protected errorLocator: Locator;

  constructor(
    protected page: Page,
    protected testId: string
  ) {
    this.locator = page.locator(`[data-testid="${testId}"]`);
    this.errorLocator = page.locator(`[data-testid="${testId}-error"]`);
  }

  async fill(value: string): Promise<void> {
    await this.locator.waitFor({ state: "visible" });
    await this.locator.clear();
    await this.locator.fill(value);
  }

  async getValue(): Promise<string> {
    return await this.locator.inputValue();
  }

  async clear(): Promise<void> {
    await this.locator.clear();
  }

  async blur(): Promise<void> {
    await this.locator.blur();
  }

  async focus(): Promise<void> {
    await this.locator.focus();
  }

  async isVisible(): Promise<boolean> {
    try {
      await this.locator.waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async isDisabled(): Promise<boolean> {
    return await this.locator.isDisabled();
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorLocator.waitFor({ state: "visible", timeout: 2000 });
      return await this.errorLocator.textContent();
    } catch {
      return null;
    }
  }

  async hasError(): Promise<boolean> {
    try {
      await this.errorLocator.waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async getAttribute(name: string): Promise<string | null> {
    return await this.locator.getAttribute(name);
  }
}

/**
 * EmailField - Specialized FormField for email input
 */
export class EmailField extends FormField {
  constructor(page: Page) {
    super(page, "login-email-input");
  }
}

/**
 * PasswordField - Specialized FormField for password input with toggle functionality
 */
export class PasswordField extends FormField {
  private toggleButton: Locator;

  constructor(page: Page) {
    super(page, "login-password-input");
    this.toggleButton = page.locator('[data-testid="login-password-toggle"]');
  }

  async toggleVisibility(): Promise<void> {
    await this.toggleButton.click();
    await this.page.waitForTimeout(100);
  }

  async isPasswordVisible(): Promise<boolean> {
    const type = await this.getAttribute("type");
    return type === "text";
  }

  async getToggleAriaPressed(): Promise<string | null> {
    return await this.toggleButton.getAttribute("aria-pressed");
  }

  async submitWithEnter(): Promise<void> {
    await this.locator.press("Enter");
  }
}

/**
 * ErrorAlert - Encapsulates general error alert behavior
 */
export class ErrorAlert {
  private locator: Locator;
  private fallbackLocator: Locator;

  constructor(page: Page) {
    this.locator = page.locator('[data-testid="login-error-alert"]');
    this.fallbackLocator = page.locator('[role="alert"]').first();
  }

  async isVisible(): Promise<boolean> {
    try {
      const visible = await this.locator.isVisible().catch(() => false);
      if (visible) return true;
      return await this.fallbackLocator.isVisible().catch(() => false);
    } catch {
      return false;
    }
  }

  async getMessage(): Promise<string | null> {
    try {
      await this.locator.waitFor({ state: "visible", timeout: 2000 });
      return await this.locator.textContent();
    } catch {
      try {
        await this.fallbackLocator.waitFor({ state: "visible", timeout: 2000 });
        return await this.fallbackLocator.textContent();
      } catch {
        return null;
      }
    }
  }

  async hasRole(role: string): Promise<boolean> {
    const roleAttr = await this.locator.getAttribute("role").catch(() => null);
    return roleAttr === role;
  }
}

/**
 * NavigationLinks - Encapsulates navigation links behavior
 */
export class NavigationLinks {
  private forgotPasswordLinkLocator: Locator;
  private registerLinkLocator: Locator;

  constructor(page: Page) {
    this.forgotPasswordLinkLocator = page.locator('[data-testid="login-forgot-password-link"]');
    this.registerLinkLocator = page.locator('[data-testid="login-register-link"]');
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLinkLocator.click();
  }

  async clickRegister(): Promise<void> {
    await this.registerLinkLocator.click();
  }

  async getForgotPasswordHref(): Promise<string | null> {
    return await this.forgotPasswordLinkLocator.getAttribute("href");
  }

  async getRegisterHref(): Promise<string | null> {
    return await this.registerLinkLocator.getAttribute("href");
  }

  async isForgotPasswordVisible(): Promise<boolean> {
    return await this.forgotPasswordLinkLocator.isVisible();
  }

  async isRegisterVisible(): Promise<boolean> {
    return await this.registerLinkLocator.isVisible();
  }
}
