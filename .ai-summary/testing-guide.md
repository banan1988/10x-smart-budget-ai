# Testowanie w SmartBudgetAI

Projekt wykorzystuje nowoczesne narzędzia testujące do zapewnienia wysokiej jakości kodu. Poniżej znajduje się przewodnik po konfiguracji i użytkowaniu testów.

## Testowanie Jednostkowe i Integracyjne - Vitest

### Co to jest Vitest?

Vitest to nowoczesny test runner zasilany przez Vite, zaprojektowany specjalnie dla projektów Vue/React/Astro. Oferuje:
- Szybkie uruchamianie testów dzięki integralnej cache'owaniu Vite
- Wsparcie dla TypeScript bez konfiguracji
- Watch mode do instant feedback
- Pokrycie kodu (coverage)

### Struktura Testów Jednostkowych

```
src/
├── lib/
│   ├── services/
│   │   ├── service.ts
│   │   └── service.test.ts          # Testy dla serwisów
├── components/
│   ├── Component.tsx
│   └── Component.test.tsx            # Testy dla komponentów React
└── test/
    ├── setup.ts                      # Globalna konfiguracja testów
    └── mocks/
        ├── server.ts                 # Konfiguracja MSW
        └── handlers.ts               # Handlery API dla MSW
```

### Uruchamianie Testów Jednostkowych

```bash
# Uruchom wszystkie testy w watch mode (rekomendowane podczas development)
npm run test

# Uruchom testy z interfejsem graficznym
npm run test:ui

# Uruchom testy jednorazowo (CI environment)
npm run test:run

# Uruchom testy z pokryciem kodu
npm run test:coverage
```

### Przykład Testu Jednostkowego

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateBudget } from '@/lib/services/budget.service';

describe('BudgetService', () => {
  it('should calculate total expenses correctly', () => {
    const expenses = [100, 200, 150];
    const result = calculateBudget(expenses);
    expect(result).toBe(450);
  });

  it('should handle empty expenses array', () => {
    const result = calculateBudget([]);
    expect(result).toBe(0);
  });
});
```

### Testowanie Komponentów React

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/LoginForm';

describe('LoginForm Component', () => {
  it('should render login form fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Mockowanie Funkcji

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Function Mocking', () => {
  it('should mock a function', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should spy on existing function', () => {
    const obj = { method: () => 'original' };
    const spy = vi.spyOn(obj, 'method');
    obj.method();
    expect(spy).toHaveBeenCalled();
  });
});
```

### Mock Service Worker (MSW)

MSW pozwala na mockowanie API bez potrzeby modyfikacji kodu. Handlery są zdefiniowane w `src/test/mocks/handlers.ts`.

```typescript
// Dodanie handlera dla nowego endpointa
export const handlers = [
  http.post('/api/transactions', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: '1', ...body },
      { status: 201 }
    );
  }),
];
```

## Testowanie E2E - Playwright

### Co to jest Playwright?

Playwright to narzędzie do automatyzacji testów End-to-End, umożliwiające:
- Testowanie w rzeczywistych przeglądarach (Chromium, Firefox, WebKit)
- Testowanie interakcji użytkownika
- Walidacja wizualna (Visual comparison)
- Debugowanie z trace viewer'em

### Konfiguracja Playwright

Plik `playwright.config.ts` zawiera:
- Ustawienia przeglądarki (Chromium)
- Timeout'y i retry'e
- Raporty (HTML, JSON)
- Screenshot'y i wideo dla nieudanych testów
- Ścieżka do serwera aplikacji

### Struktura Testów E2E

```
src/e2e/
├── fixtures/
│   ├── basePage.ts                  # Klasa bazowa Page Object Model
│   ├── loginPage.ts                 # Page Object dla strony logowania
│   └── dashboardPage.ts             # Page Object dla dashboardu
└── *.spec.ts                        # Pliki testowe E2E
    ├── login.spec.ts
    ├── transactions.spec.ts
    └── dashboard.spec.ts
```

### Uruchamianie Testów E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy z interfejsem graficznym (rekomendowane)
npm run test:e2e:ui

# Debugowanie testów
npm run test:e2e:debug

# Pokaż raport HTML z wynikami testów
npm run test:e2e:report
```

### Page Object Model Pattern

Page Object Model (POM) to wzorzec projektowy dla E2E, gdzie każda strona/sekcja aplikacji ma swoją klasę:

```typescript
// src/e2e/fixtures/dashboardPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './basePage';

export class DashboardPage extends BasePage {
  readonly balanceCard = this.page.locator('[data-testid="balance-card"]');
  readonly addTransactionButton = this.page.locator('button:has-text("Add Transaction")');
  readonly transactionsList = this.page.locator('[data-testid="transactions-list"]');

  async goto() {
    await super.goto('/dashboard');
  }

  async getBalance() {
    return await this.balanceCard.textContent();
  }

  async clickAddTransaction() {
    await this.addTransactionButton.click();
  }

  async getTransactionCount() {
    return await this.transactionsList.locator('li').count();
  }
}
```

```typescript
// src/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from './fixtures/dashboardPage';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should display user balance', async () => {
    const balance = await dashboardPage.getBalance();
    expect(balance).toBeTruthy();
  });

  test('should add new transaction', async () => {
    const initialCount = await dashboardPage.getTransactionCount();
    await dashboardPage.clickAddTransaction();
    // Fill form and submit...
    const finalCount = await dashboardPage.getTransactionCount();
    expect(finalCount).toBe(initialCount + 1);
  });
});
```

### Walidacja Wizualna

```typescript
test('should match visual appearance', async ({ page }) => {
  await page.goto('/dashboard');
  // Czekaj na dynamiczną zawartość
  await page.waitForLoadState('networkidle');
  expect(await page.screenshot()).toMatchSnapshot();
});
```

### Testowanie API w E2E

```typescript
test('should create transaction via API', async ({ page, request }) => {
  // API call
  const response = await request.post('/api/transactions', {
    data: {
      description: 'Test Transaction',
      amount: 100,
      category: 'Food',
    },
  });
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(201);
});
```

## Best Practices

### Testowanie Jednostkowe

1. **Struktura AAA (Arrange-Act-Assert)**
   ```typescript
   it('should calculate sum', () => {
     // Arrange
     const numbers = [1, 2, 3];
     // Act
     const result = sum(numbers);
     // Assert
     expect(result).toBe(6);
   });
   ```

2. **Opisowe nazwy testów**
   - ✅ `should return error when user not found`
   - ❌ `test user search`

3. **Izolacja testów** - każdy test powinien być niezależny

4. **Mockowanie zależności** - nie testuj kodu zewnętrznego

### Testowanie E2E

1. **Używaj Page Object Model** - upraszcza utrzymanie testów
2. **Testuj scenariusze użytkownika** - nie szczegóły implementacji
3. **Czekaj na elementy** - nie hardkoduj timeout'ów
4. **Użyj atrybutów data-testid** - niezawodne selektory

## Coverage

Aby sprawdzić pokrycie kodu:

```bash
npm run test:coverage
```

Raport HTML będzie dostępny w `coverage/index.html`.

Threshold'y dla pokrycia są skonfigurowane w `vitest.config.ts`:
- Lines: 50%
- Functions: 50%
- Branches: 50%
- Statements: 50%



## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/)
- [Mock Service Worker](https://mswjs.io/)

