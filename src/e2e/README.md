# E2E Testing Directory Structure

## Overview

This directory contains End-to-End tests using Playwright. Tests follow the Page Object Model (POM) pattern for maintainability and resilience as per Playwright best practices.

```
src/e2e/
├── fixtures/
│   ├── basePage.ts          # Base class for all page objects
│   ├── loginPage.ts         # Page Object for login page
│   └── [more page objects]
├── login.spec.ts            # Test file for login functionality
└── [more test files]
```

## Setup & Running Tests

### Installation
```bash
npm install
```

### Environment Setup
Create `.env.test` file in the project root:
```env
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your-test-password
```

### Run Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test src/e2e/login.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Open UI mode for visual debugging
npx playwright test --ui

# Generate test from browser recording
npx codegen http://localhost:3000
```

## Page Object Model Pattern

Each page/section of the application should have a corresponding Page Object:

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './basePage';

export class MyPage extends BasePage {
  // Locators - use resilient selectors
  readonly button = this.page.locator('button[type="submit"]');
  readonly errorAlert = this.page.locator('[role="alert"]');
  
  // Navigation
  async goto() {
    await super.goto('/mypage');
  }

  // User interactions
  async clickButton() {
    await this.button.click();
  }

  // Assertions helpers
  async isErrorVisible(): Promise<boolean> {
    try {
      await this.errorAlert.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
```

## Testing Guidelines (Playwright Best Practices)

### 1. Browser Context Isolation ✅
- Each test uses an isolated browser context for clean test environment
- Contexts are properly cleaned up in `afterEach` hooks
```typescript
test.beforeEach(async ({ page, context }) => {
  const isolatedPage = await context.newPage();
  // use isolatedPage
});

test.afterEach(async () => {
  await isolatedPage.context().close();
});
```

### 2. Resilient Locator Selection ✅
- Prefer role-based selectors: `page.locator('[role="button"]')`
- Use type-specific selectors: `input[type="email"]`
- Avoid positional selectors or too-specific CSS paths
- Avoid `xpath` unless absolutely necessary

### 3. Explicit Waits & Timeouts ✅
- Wait for elements before interaction: `await element.waitFor({ state: 'visible' })`
- Set appropriate timeouts (5s for elements, 30s for navigation)
- Use `expect()` with specific matchers for assertions

### 4. Test Hooks ✅
- `test.beforeEach()` - Set up test environment, navigate to page
- `test.afterEach()` - Clean up, close contexts, logout users
- Use `test.skip()` for conditional test skipping

### 5. Assertions Best Practices ✅
- Use specific matchers: `expect(element).toBeVisible()`, `toHaveURL()`, `toContainText()`
- Include assertion messages for clarity
- Assert after each significant action

### 6. Visual Regression Testing
- Screenshots on failure: configured in `playwright.config.ts`
- Manual screenshots: `await page.screenshot({ path: 'path' })`
```typescript
test('visual test', async ({ page }) => {
  await expect(page).toHaveScreenshot();
});
```

### 7. API Testing Integration
- Use `APIRequestContext` for backend validation
```typescript
const response = await request.post('/api/login', {
  data: { email: 'user@example.com', password: 'pass' }
});
expect(response.status()).toBe(200);
```

### 8. Test Organization
- Group related tests with `test.describe()`
- Use descriptive test names explaining what is being tested
- Follow Arrange-Act-Assert pattern:
```typescript
test('should show error on invalid email', async () => {
  // Arrange
  await loginPage.goto();

  // Act
  await loginPage.fillEmail('invalid-email');
  await loginPage.submit();

  // Assert
  await expect(loginPage.errorMessage).toBeVisible();
});
```

## Files Description

### fixtures/basePage.ts
Base class providing:
- Navigation with proper wait states
- Element visibility checks
- Screenshot functionality
- URL and title helpers
- Resilient element waiting with timeouts

### fixtures/loginPage.ts
Login page Page Object with:
- Locators for email, password, submit button
- Error message locator
- User interaction methods
- Helper methods for form validation

### login.spec.ts
Login tests including:
- Form display verification
- Invalid credential handling
- Form validation edge cases
- Navigation on successful login
- Error message clearing

## Configuration

Configuration in `playwright.config.ts`:
- Only Chromium browser (can be extended)
- Desktop Chrome device profile
- Trace recording on first retry
- Screenshots on failure
- Video recording on failure
- HTML and JSON reports
- Base URL from environment variables
- Proper timeout settings for elements and pages

## Debugging

### View HTML Report
```bash
npx playwright show-report
```

### Check Traces
Traces are recorded on first retry and viewable in HTML report

### Debug Single Test
```bash
npx playwright test --debug -g "test name"
```

## CI/CD Integration

In CI environments:
- Tests run serially (1 worker)
- Failed tests are retried 2 times
- No server reuse (fresh server for each run)
- Full traces and videos recorded

## Tips & Tricks

1. **Locator Debugging**: Use `page.locator().or()` for multiple selectors
2. **Network Idle**: Use `waitForLoadState('networkidle')` for data-heavy pages
3. **Conditional Skipping**: `test.skip(condition, 'reason')`
4. **Slow Motion**: `npx playwright test --slow-motion=1000`
5. **Timeout Override**: Pass `timeout` option to specific expects

