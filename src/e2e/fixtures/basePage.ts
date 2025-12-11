import { Page } from '@playwright/test';

/**
 * Base Page Object for common page interactions
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForNavigation(action: () => Promise<void>) {
    await Promise.all([this.page.waitForNavigation(), action()]);
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/e2e/screenshots/${name}.png` });
  }
}

