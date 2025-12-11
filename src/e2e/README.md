# E2E Testing Directory Structure

## Overview

This directory contains End-to-End tests using Playwright. Tests follow the Page Object Model (POM) pattern for maintainability.

```
src/e2e/
├── fixtures/
│   ├── basePage.ts          # Base class for all page objects
│   ├── loginPage.ts         # Page Object for login page
│   └── dashboardPage.ts     # Page Object for dashboard (example)
├── login.spec.ts            # Test file for login functionality
└── dashboard.spec.ts        # Test file for dashboard (example)
```

## Files

### fixtures/basePage.ts
Base class that all Page Objects inherit from. Provides:
- Common navigation methods (`goto()`)
- Screenshot functionality
- Navigation helpers

### fixtures/loginPage.ts
Page Object Model for the login page. Contains:
- Locators for form elements
- Helper methods for user interactions
- Assertion helper methods

### Test Files (*.spec.ts)
Actual test scenarios using the Page Objects. Each file:
- Imports relevant Page Objects
- Sets up test fixtures
- Implements test cases
- Uses Playwright's expect assertions

## Page Object Model Pattern

Each page/section of the application should have a corresponding Page Object:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './basePage';

export class MyPage extends BasePage {
  // Locators
  readonly button = this.page.locator('button');
  
  // Navigation
  async goto() {
    await super.goto('/my-path');
  }
  
  // Actions
  async clickButton() {
    await this.button.click();
  }
  
  // Assertions
  async getButtonText() {
    return await this.button.textContent();
  }
}
```

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from './fixtures/myPage';

test.describe('My Feature', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.goto();
  });

  test('should perform action', async () => {
    await myPage.clickButton();
    expect(await myPage.getButtonText()).toBe('Expected Text');
  });
});
```

## Best Practices

1. **Use Page Objects**: All page interactions should go through Page Objects
2. **Descriptive test names**: Test names should describe what is being tested
3. **One assertion concept per test**: Tests should focus on a single behavior
4. **Use data-testid attributes**: Add `data-testid` to elements for reliable selection
5. **Leverage API testing**: Use `request` fixture for backend validation
6. **Wait for elements**: Use locators and proper wait strategies

## Locator Strategies

Prefer in this order:
1. `getByRole()` - Most accessible
2. `getByLabel()` - For form inputs
3. `getByPlaceholder()` - For input placeholders
4. `getByText()` - For text content
5. `locator('[data-testid="..."]')` - For elements without accessible identifiers

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# UI mode (interactive, recommended)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Show report
npm run test:e2e:report

# Run specific test
npm run test:e2e -- src/e2e/login.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "login"
```

## Configuration

Tests are configured in `playwright.config.ts`:
- Browser: Chromium only (as per requirements)
- Base URL: http://localhost:3000 (or BASE_URL env var)
- Timeout: 30 seconds (default)
- Retries: 2 in CI, 0 locally
- Screenshots: Captured on failure
- Videos: Saved on failure
- Trace: Recorded on first retry
- Reports: HTML and JSON

## Debugging

1. **UI Mode**: `npm run test:e2e:ui` - Best for interactive debugging
2. **Debug Mode**: `npm run test:e2e:debug` - Step through tests
3. **Trace Viewer**: Automatically opens trace files in browser
4. **Screenshots**: Saved in `test-results/e2e/` on failure
5. **Videos**: Saved in `test-results/e2e/` on failure

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

