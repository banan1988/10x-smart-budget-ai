import { Page } from "@playwright/test";

/**
 * Base Page Object for common page interactions
 * Implements Page Object Model pattern for maintainable E2E tests
 */
export class BasePage {
  constructor(public page: Page) {}

  /**
   * Navigate to a path, waiting for page to be fully loaded
   */
  async goto(path: string) {
    await this.page.goto(path);
    // Wait for page to reach idle state
    await this.page.waitForLoadState("networkidle").catch(() => {
      // Fallback if networkidle times out
      return this.page.waitForLoadState("load");
    });
  }

  /**
   * Wait for navigation and perform an action simultaneously
   */
  async waitForNavigation(action: () => Promise<void>) {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "networkidle" }), action()]);
  }

  /**
   * Take a screenshot for visual testing
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/e2e/screenshots/${name}.png` });
  }

  /**
   * Wait for element visibility with timeout
   */
  async waitForElement(selector: string, timeout = 5000) {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    return locator;
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }
}
