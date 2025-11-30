# Plan implementacji widoku Strony Rejestracji

## 1. Przegląd

Strona rejestracji (`/register`) jest punktem wejścia dla nowych użytkowników chcących się zalogować do aplikacji SmartBudgetAI. Głównym celem widoku jest konwersja nowych użytkowników poprzez intuicyjny i bezpieczny formularz rejestracyjny. Strona zawiera formularz z polami email, hasło i potwierdzenie hasła, wskaźnik siły hasła, możliwość pokazania/ukrycia hasła oraz komunikat o polityce prywatności.

## 2. Routing widoku

- **Ścieżka:** `/register`
- **Typ:** Publiczna strona dostępna dla niezalogowanych użytkowników
- **Plik:** `src/pages/register.astro`
- **Middleware:** Zalogowani użytkownicy powinni być automatycznie przekierowani na `/dashboard` w middleware

## 3. Struktura komponentów

```
RegisterPage (Astro)
├── RegisterForm (React)
│   ├── EmailInput
│   ├── PasswordInput
│   ├── ConfirmPasswordInput
│   ├── PasswordStrengthIndicator (React)
│   ├── ShowPasswordToggle
│   ├── PrivacyPolicyNotice
│   ├── SubmitButton
│   └── LoginLink
```

## 4. Szczegóły komponentów

### RegisterPage (register.astro)

- **Opis komponentu:** Strona główna rejestracji, komponent Astro odpowiadający za layout i strukturę. Importuje i renderuje komponent RegisterForm jako interaktywny komponent React.
- **Główne elementy:**
  - Layout wrapper (Layout.astro)
  - Kontener główny z nagłówkiem "Rejestracja"
  - RegisterForm komponent React z client-side interaktywnością
  - Opcjonalny link do strony logowania
- **Obsługiwane interakcje:** Przekierowanie po udanej rejestracji, obsługa błędów
- **Obsługiwana walidacja:** Brak (delegowana do RegisterForm)
- **Typy:** Brak
- **Propsy:** Brak

### RegisterForm (React)

- **Opis komponentu:** Główny formularz rejestracyjny obsługujący całą logikę rejestracji, walidacji i komunikacji z API. Komponent zarządza stanem formularza i błędami.
- **Główne elementy:**
  - Pole Email (`<Input>` z shadcn/ui)
  - Pole Hasło (`<Input>` z type="password")
  - Przycisk Show/Hide hasła
  - PasswordStrengthIndicator (niestandardowy komponent)
  - Pole Potwierdzenia Hasła (`<Input>` z type="password")
  - Przycisk potwierdzenia (`<Button>`)
  - Tekst informacyjny o polityce prywatności
  - Link do strony logowania
  - Toast notifications dla błędów/sukcesu
- **Obsługiwane interakcje:**
  - Wpisywanie emaila z walidacją w czasie rzeczywistym (format email)
  - Wpisywanie hasła z dynamicznym wskaźnikiem siły
  - Przełączanie widoczności hasła (przycisk show/hide)
  - Wpisywanie potwierdzenia hasła z walidacją dopasowania
  - Złożenie formularza (button submit)
  - Obsługa błędów z backendu (wyświetlanie w toascie)
- **Obsługiwana walidacja:**
  - Email: format poprawny (walidacja regex lub biblioteka), maksymalnie 255 znaków
  - Hasło: minimum 8 znaków, wymagane: wielkie litery, małe litery, cyfry, znaki specjalne
  - Potwierdzenie hasła: musi być identyczne z hasłem
  - Walidacja po stronie klienta przed wysłaniem
  - Walidacja po stronie serwera (serwer ponownie weryfikuje dane)
  - Obsługa błędów: email już istnieje, błąd połączenia, błąd serwera
- **Typy:** RegisterFormProps, RegisterFormState, RegisterRequest, RegisterResponse
- **Propsy:** Brak (komponent autonomiczny)

### PasswordStrengthIndicator

- **Opis komponentu:** Niestandardowy komponent wyświetlający wizualne wskazanie siły hasła na podstawie wprowadzonego hasła. Aktualizuje się w czasie rzeczywistym.
- **Główne elementy:**
  - Pasek siły (visual bar z różnymi kolorami)
  - Tekst opisowy (np. "Słabe", "Średnie", "Silne")
  - Lista wymagań (checklisty dla: wielkie litery, małe litery, cyfry, znaki specjalne, długość)
- **Obsługiwane interakcje:** Dynamiczna aktualizacja na podstawie zmian w polu hasła
- **Obsługiwana walidacja:** Brak (tylko wyświetlanie)
- **Typy:** PasswordStrengthIndicatorProps
- **Propsy:**
  - `password: string` - aktualne hasło z pola
  - `showDetails?: boolean` - czy pokazać listę wymagań (domyślnie true)

### ShowPasswordToggle

- **Opis komponentu:** Przycisk toggle do pokazania/ukrycia hasła w polach input. Zmienia type input z "password" na "text" i odwrotnie.
- **Główne elementy:**
  - Ikona (Eye/EyeOff z React Icons lub podobnie)
  - Przycisk bez labelu z aria-label
- **Obsługiwane interakcje:** Klik zmienia stan widoczności hasła
- **Obsługiwana walidacja:** Brak
- **Typy:** ShowPasswordToggleProps
- **Propsy:**
  - `isVisible: boolean` - czy hasło jest widoczne
  - `onChange: (visible: boolean) => void` - callback zmian

### PrivacyPolicyNotice

- **Opis komponentu:** Statyczny komponent wyświetlający informację o polityce prywatności i warunkach użytkowania z linkami.
- **Główne elementy:**
  - Tekst zgody z linkami do polityki prywatności i warunków
  - Linki do odpowiednich stron (lub modal)
- **Obsługiwane interakcje:** Klik na linki
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

## 5. Typy

### RegisterFormState

```typescript
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  error: string | null;
  fieldErrors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}
```

### RegisterRequest

```typescript
interface RegisterRequest {
  email: string;
  password: string;
}
```

### RegisterResponse

```typescript
interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
  };
}
```

### PasswordStrengthIndicatorProps

```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}
```

### PasswordStrength (typ enum/union)

```typescript
type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number; // 0-100
  requirements: {
    minLength: boolean; // minimum 8 znaków
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigit: boolean;
    hasSpecialChar: boolean;
  };
}
```

### ShowPasswordToggleProps

```typescript
interface ShowPasswordToggleProps {
  isVisible: boolean;
  onChange: (visible: boolean) => void;
  ariaLabel?: string;
}
```

## 6. Zarządzanie stanem

### Zastosowana architektura: React Hooks

**Stan lokalny komponentu RegisterForm:**
- `formState: RegisterFormState` - zarządza wszystkimi danymi formularza
- `useState` do śledzenia zmian w każdym polu
- Validacja w real-time (`onChange`)

**Niestandardowy hook: `useRegisterForm` (opcjonalnie)**

Jeśli logika stanie się skomplikowana, można wyodrębnić do custom hooka:

```typescript
interface UseRegisterFormReturn {
  formState: RegisterFormState;
  handleEmailChange: (email: string) => void;
  handlePasswordChange: (password: string) => void;
  handleConfirmPasswordChange: (confirmPassword: string) => void;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  getPasswordStrength: () => PasswordStrengthResult;
}

export function useRegisterForm(): UseRegisterFormReturn {
  // implementacja...
}
```

**Walidacja:**
- Walidacja emaila: regex lub biblioteka `email-validator`
- Walidacja hasła: custom funkcja `validatePasswordStrength()`
- Porównanie haseł: `password === confirmPassword`
- Walidacja po stronie klienta w onChange i onBlur
- Walidacja po stronie serwera (powtórka bezpieczeństwa)

## 7. Integracja API

### Endpoint rejestracji

**POST /api/auth/register**

**Request:**
```typescript
{
  email: string;        // Email użytkownika, maks 255 znaków, format email
  password: string;     // Hasło spełniające wymagania (min 8 znaków)
}
```

**Response (201 Created):**
```typescript
{
  user: {
    id: string;        // UUID użytkownika
    email: string;
  },
  session: {
    access_token: string;
    refresh_token: string;
  }
}
```

**Error Responses:**

- **400 Bad Request:**
  ```typescript
  {
    error: 'Validation failed',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password must be at least 8 characters' }
    ]
  }
  ```

- **409 Conflict:**
  ```typescript
  {
    error: 'Email already exists',
    message: 'An account with this email is already registered'
  }
  ```

- **500 Internal Server Error:**
  ```typescript
  {
    error: 'Registration failed',
    message: 'An error occurred during registration'
  }
  ```

### Implementacja API (backend)

**Plik:** `src/pages/api/auth/register.ts`

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // Parsowanie body
  // Walidacja za pomocą Zod schema
  // Sprawdzenie, czy email istnieje (SELECT * FROM users WHERE email = ...)
  // Hash hasła przy użyciu bcrypt
  // Utworzenie użytkownika w Supabase Auth
  // Utworzenie user_profile w bazie danych
  // Zwrócenie sesji lub redirect na login
}
```

### Zod Schema do walidacji

```typescript
export const RegisterCommandSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
});

export type RegisterCommand = z.infer<typeof RegisterCommandSchema>;
```

## 8. Interakcje użytkownika

1. **Otwarcie strony rejestracji:**
   - Użytkownik przechodzi na `/register`
   - Widzi stronę z formularzem rejestracyjnym
   - Pola są puste, przycisk submit jest dostępny

2. **Wpisywanie emaila:**
   - Użytkownik klika na pole email
   - Wpisuje adres email
   - W real-time wyświetlana jest walidacja (czerwony tekst błędu, jeśli format nieprawidłowy)

3. **Wpisywanie hasła:**
   - Użytkownik klika na pole hasła
   - Wpisuje hasło (znaki są domyślnie ukryte)
   - PasswordStrengthIndicator wyświetla się dynamicznie poniżej pola
   - Pokazuje wyliczoną siłę hasła (pasek kolorowy)
   - Wyświetla checklistę wymagań z zaznaczeniem spełnionych

4. **Pokazanie/ukrycie hasła:**
   - Użytkownik klika przycisk Show/Hide (ikona oka)
   - Hasło zmienia się z `type="password"` na `type="text"`
   - Icon zmienia się na EyeOff

5. **Wpisywanie potwierdzenia hasła:**
   - Użytkownik klika na pole confirmPassword
   - Wpisuje hasło ponownie
   - Jeśli nie odpowiada, wyświetla się błąd walidacji

6. **Złożenie formularza:**
   - Użytkownik klika przycisk "Zarejestruj się"
   - Frontend wykonuje walidację klienta (wszystkie pola muszą spełniać wymagania)
   - Jeśli walidacja przejdzie: wysłanie POST do `/api/auth/register`
   - Podczas wysyłania: przycisk jest disabled, spinner zamiast tekstu

7. **Sukces rejestracji:**
   - API zwraca 201 z sesją
   - Toast notification: "Rejestracja udana! Witaj w SmartBudgetAI"
   - Po 2 sekundach: redirect na `/dashboard`

8. **Błąd rejestracji:**
   - Jeśli email już istnieje: toast error "Ten email jest już zarejestrowany"
   - Jeśli błąd serwera: toast error "Błąd podczas rejestracji. Spróbuj później"
   - Pole email lub formularz mogą być disabled tymczasowo

9. **Klik na link do logowania:**
   - Link "Masz już konto? Zaloguj się" prowadzi na `/login`

## 9. Warunki i walidacja

### Walidacja emaila

- **Komponent:** RegisterForm
- **Warunki:**
  - Wymagane pole (nie może być puste)
  - Format poprawny (RFC 5322 lub uproszczony regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Maksymalnie 255 znaków
  - Case-insensitive (backend powinien znormalizować do lowercase)
- **Wpływ na stan:**
  - Jeśli poprawne: brak błędu, pole ma border Success (zielony lub neutralny)
  - Jeśli niepoprawne: wyświetlony tekst błędu pod polem, border Error (czerwony)
  - Przycisk submit pozostaje dostępny (walidacja może być wykonana dopiero przy submit)

### Walidacja hasła

- **Komponent:** RegisterForm + PasswordStrengthIndicator
- **Warunki:**
  - Wymagane pole (nie może być puste)
  - Minimum 8 znaków
  - Minimum 1 wielka litera (A-Z)
  - Minimum 1 mała litera (a-z)
  - Minimum 1 cyfra (0-9)
  - Minimum 1 znak specjalny (!@#$%^&*)
- **Wpływ na stan:**
  - PasswordStrengthIndicator pokazuje dynamicznie:
    - Pasek siły (Weak/Medium/Strong/Very Strong) ze zmianą koloru (czerwony → żółty → zielony)
    - Checklistę wymagań ze statusem każdego
  - Przycisk submit jest dostępny nawet jeśli hasło jest słabe (backend ostatecznie waliduje)

### Walidacja potwierdzenia hasła

- **Komponent:** RegisterForm
- **Warunki:**
  - Musi być identyczne z polem hasła
  - Wymagane pole
- **Wpływ na stan:**
  - Jeśli nie odpowiada: tekst błędu "Hasła nie są identyczne", border Error
  - Jeśli odpowiada: brak błędu
  - Real-time porównanie podczas wpisywania (onChange)

### Walidacja serwera

- **Endpoint:** POST /api/auth/register
- **Warunki (powtórka z klienta + dodatkowe):**
  - Email w poprawnym formacie
  - Hasło spełnia wszystkie wymagania
  - Email nie istnieje już w bazie (SELECT COUNT(*) FROM users WHERE email = ?)
  - Brak SQL injection (parametryzowane zapytania)
  - Hasło jest hashowane bezpośrednio przed zapisem (bcrypt lub Supabase Auth)
- **Wpływ na błędy:**
  - 400: Walidacja nie przeszła (pole `details` z listą błędów)
  - 409: Email już istnieje
  - 500: Błąd serwera

### Warunki dla przycisku submit

- **Przycisk jest enabled, gdy:**
  - Wszystkie pola są wypełnione (nie puste)
  - Walidacja klienta przeszła (email, hasło, potwierdzenie)
- **Przycisk jest disabled, gdy:**
  - Wysyłane żądanie (isLoading = true)
  - Brakuje jakichkolwiek pól
  - Walidacja klienta nie przeszła

## 10. Obsługa błędów

### Błędy walidacji formularza

- **Email - format nieprawidłowy:**
  - Wyświetlenie: Tekst "Nieprawidłowy format emaila" pod polem
  - Kolor: Czerwony tekst, border pola czerwony
  - Kiedy: onBlur lub onChange (real-time)

- **Email - już istnieje (backend):**
  - Wyświetlenie: Toast notification lub błąd w formularzu
  - Kolor: Czerwony (error)
  - Kiedy: Po submicie formularza, jeśli server zwróci 409
  - Akcja: Czyszczenie pola hasła, fokus na polu emaila

- **Hasło - nie spełnia wymagań:**
  - Wyświetlenie: PasswordStrengthIndicator pokazuje które wymagania nie są spełnione
  - Kolor: Unchecklisty nieukończone (szare/czerwone)
  - Kiedy: Real-time podczas wpisywania

- **Hasła - nie pasują do siebie:**
  - Wyświetlenie: Tekst "Hasła nie są identyczne" pod polem confirmPassword
  - Kolor: Czerwony
  - Kiedy: Real-time onChange na polu confirmPassword

### Błędy serwera

- **Błąd połączenia / timeout:**
  - Wyświetlenie: Toast notification "Błąd połączenia. Spróbuj później."
  - Kolor: Żółty (warning) lub czerwony (error)
  - Akcja: Przycisk retry lub możliwość ponownego submitu

- **Błąd 500 Internal Server Error:**
  - Wyświetlenie: Toast notification "Błąd aplikacji. Administratorzy zostali powiadomieni."
  - Kolor: Czerwony
  - Akcja: Logowanie błędu do sentry/external service

- **Rate limiting (429 Too Many Requests):**
  - Wyświetlenie: Toast notification "Zbyt wiele prób. Spróbuj za {X} sekund."
  - Kolor: Pomarańczowy (warning)
  - Akcja: Disabled przycisk submit na określony czas

### Scenariusze brzegowe

- **Użytkownik zmienia email na już istniejący:**
  - Frontend nie waliduje tego, ale backend zwraca 409
  - Wyświetlenie: Toast + pole email ma focus

- **Użytkownik kopiuje hasło z innego źródła (białe znaki):**
  - Frontend trim() przed wysłaniem OR pokazuje warning
  - Serwer powinien nie trimować (hasła mogą zawierać spacje)

- **Użytkownik wyłącza JavaScript:**
  - Formularz powinien być `<form>` HTML z `action` i `method="POST"`
  - Fallback walidacja po stronie serwera

- **Użytkownik szybko klika przycisk submit wiele razy:**
  - Frontend: Debounce / throttle submita
  - Disable przycisku na czas wysyłania
  - Backend: Idempotent operacja lub deduplication

## 11. Kroki implementacji

### Etap 1: Przygotowanie struktury i typów

1. **Utwórz plik strony:** `src/pages/register.astro`
   - Import Layout.astro
   - Import RegisterForm komponentu React
   - Struktura HTML (header, container, main section)
   - Upewnij się, że middleware loguje zalogowanych użytkowników do /dashboard

2. **Definiuj typy w `src/types.ts`:**
   - RegisterFormState
   - RegisterRequest
   - RegisterResponse
   - PasswordStrengthResult
   - ShowPasswordToggleProps
   - PasswordStrengthIndicatorProps

3. **Utwórz Zod schema w `src/types.ts`:**
   - RegisterCommandSchema

### Etap 2: Implementacja komponentów React

4. **Utwórz komponent `src/components/PasswordStrengthIndicator.tsx`:**
   - Logika obliczania siły hasła (funkcja `validatePasswordStrength()`)
   - Wyświetlanie paska z kolorami (weak=czerwony, medium=żółty, strong=zielony)
   - Checklisty wymagań (wielkie litery, małe litery, cyfry, znaki specjalne, długość)
   - Props: `password: string`, `showDetails?: boolean`

5. **Utwórz komponent `src/components/ShowPasswordToggle.tsx`:**
   - Przycisk z ikoną oka (Eye/EyeOff)
   - onClick zmienia stan widoczności
   - aria-label dla accessibility

6. **Utwórz komponent `src/components/PrivacyPolicyNotice.tsx`:**
   - Tekst zgodny z wymaganiami RODO
   - Linki do polityki prywatności i warunków użytkowania

7. **Utwórz niestandardowy hook `src/components/hooks/useRegisterForm.ts` (opcjonalnie):**
   - Logika zarządzania stanem formularza
   - Funkcje walidacji
   - Obsługa submitu

8. **Utwórz główny komponent `src/components/RegisterForm.tsx`:**
   - State: email, password, confirmPassword, showPassword, showConfirmPassword, isLoading, error, fieldErrors
   - Pola Input dla email, password, confirmPassword
   - PasswordStrengthIndicator pod polem hasła
   - ShowPasswordToggle dla obu pól hasła
   - PrivacyPolicyNotice
   - Przycisk submit
   - Link do logowania
   - Toast notifications dla błędów/sukcesu
   - Obsługa fetch POST do `/api/auth/register`
   - Redirect na `/dashboard` po sukcesie

### Etap 3: Implementacja API (backend)

9. **Utwórz plik API `src/pages/api/auth/register.ts`:**
   - Handler POST
   - Parsuj request body
   - Waliduj za pomocą RegisterCommandSchema
   - Sprawdź, czy email już istnieje
   - Hash hasło (bcrypt lub Supabase Auth)
   - Utwórz użytkownika w Supabase Auth
   - Utwórz user_profile w bazie danych
   - Zwróć 201 z sesją lub 409/400 z błędem
   - Error handling (logowanie błędów)

10. **Opcjonalnie: Utwórz service `src/lib/services/auth.service.ts`:**
    - Funkcja `registerUser(email: string, password: string)`
    - Sprawdzanie istniejącego emaila
    - Tworzenie użytkownika
    - Zwracanie sesji lub błędu

### Etap 4: Styling i accessibility

11. **Stylowanie Tailwind:**
    - Używaj `@layer` dla consistency
    - Ciemny tryb (dark: variant)
    - Responsive design (mobile-first)
    - Focus states dla accessibility
    - Error states (czerwone bordery, ikony)
    - Loading states (disabled button, spinner)

12. **Accessibility (ARIA):**
    - `aria-label` dla przycisków bez tekstu
    - `aria-describedby` dla pól input, wskazujący error tekst lub hint
    - `aria-required` dla wymaganych pól
    - `aria-invalid` dla pól z błędami
    - `role="alert"` dla toast notifications
    - Prawidłowa struktura heading (h1, h2, itd.)
    - Tab order logiczny
    - Color contrast (minimum WCAG AA)

### Etap 5: Testing i walidacja

13. **Testy jednostkowe:**
    - Unit test dla PasswordStrengthIndicator (`src/components/PasswordStrengthIndicator.test.ts`)
    - Unit test dla useRegisterForm hook (jeśli istnieje)

14. **Testy integracyjne:**
    - Integration test dla RegisterForm (`src/components/RegisterForm.test.ts`)
    - API test dla POST /api/auth/register (`src/pages/api/auth/register.test.ts`)

15. **Testowanie manualne:**
    - Poprawny flow rejestracji
    - Błąd "email już istnieje"
    - Walidacja hasła (wszystkie wymagania)
    - Show/hide hasła
    - Responsive design (mobile, tablet, desktop)
    - Accessibility (keyboard navigation, screen reader)
    - Network error handling
    - Redirect na dashboard po sukcesie

### Etap 6: Opracowanie dokumentacji i cleanup

16. **Dokumentacja kodu:**
    - JSDoc komentarze dla funkcji i komponentów
    - Inline komentarze dla złożonej logiki

17. **Code review checklist:**
    - Spełniają się wszystkie wymagania z PRD
    - Kod jest czysty i czytany (linting, formatting)
    - Error handling dla wszystkich scenariuszy
    - Security best practices (no XSS, SQL injection, etc.)
    - Performance (no unnecessary re-renders)
    - Accessibility (WCAG 2.1 AA)
    - Dokumentacja jest kompletna

