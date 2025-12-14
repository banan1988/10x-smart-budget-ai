# Plan implementacji widoku logowania

## 1. Przegląd

Widok logowania to pierwsza interaktywna strona, na której powracający użytkownicy mogą uwierzytelnić się w aplikacji SmartBudgetAI. Strona zawiera formularz z polami email i hasło, umożliwia weryfikację danych i obsługuje błędy autentykacji. Po pomyślnym zalogowaniu użytkownik jest przekierowywany na pulpit główny (dashboard). Widok wykorzystuje Supabase do autentykacji oraz system powiadomień do komunikacji błędów.

## 2. Routing widoku

- **Ścieżka:** `/login`
- **Plik:** `src/pages/login.astro`
- **Dostęp:** Dostępny dla niezalogowanych użytkowników
- **Redirect:** Po zalogowaniu użytkownik jest przekierowywany na `/dashboard`
- **Uwaga:** Middleware powinien sprawdzać, czy zalogowany użytkownik próbujący wejść na `/login` zostanie przekierowany na `/dashboard`

## 3. Struktura komponentów

```
LoginPage (Astro)
├── Layout (Astro)
└── LoginForm (React component)
    ├── EmailInput
    ├── PasswordInput
    ├── LoginButton
    ├── SignupLink
    └── ErrorMessages (toast notifications)
```

## 4. Szczegóły komponentów

### LoginPage (Astro - src/pages/login.astro)

- **Opis komponentu:** Strona główna widoku logowania. Jest to wrapper Astro, który renderuje formularz logowania. Strona nie wymaga żadnej specjalnej logiki po stronie serwera, głównie renderuje layout i komponent React.
- **Główne elementy:**
  - Layout z wyłączonym headerem i footrem (tylko dla landing page)
  - Kontener główny z karką zawierającą formularz
  - Formularz logowania jako komponent React
- **Obsługiwane interakcje:** Renderowanie komponentu, przekierowanie na `/dashboard` po pomyślnym zalogowaniu
- **Obsługiwana walidacja:** Brak walidacji na tym poziomie - cała walidacja odbywa się w komponencie React
- **Typy:** Brak specjalnych typów
- **Propsy:** Brak - strona jest prostym wrapperem

### LoginForm (React - src/components/LoginForm.tsx)

- **Opis komponentu:** Główny komponent formularza logowania. Zarządza stanem formularza, walidacją danych, komunikacją z API oraz obsługą błędów. Komponenty zawiera logikę do wysyłania żądania logowania do Supabase i obsługi odpowiedzi.
- **Główne elementy:**
  - Card zawierający cały formularz
  - Tytuł "Logowanie"
  - EmailInput - pole input dla emaila
  - PasswordInput - pole input dla hasła
  - Komunikat błędu (aria-live region dla dostępności)
  - LoginButton - przycisk do wysłania formularza
  - SignupLink - link do strony rejestracji
- **Obsługiwane interakcje:**
  - Zmiana wartości w polach email i hasło
  - Wysyłanie formularza (onClick na przycisk lub Enter w polu hasła)
  - Obsługa błędów autentykacji (wyświetlanie toast notifications)
  - Nawigacja na stronę rejestracji
  - Nawigacja na dashboard po pomyślnym zalogowaniu
- **Obsługiwana walidacja:**
  - Format email (walidacja regex) - natychmiastowa
  - Hasło nie może być puste
  - Długość hasła minimum 6 znaków
  - API zwraca błędy: "Invalid login credentials", "Email not confirmed", "Too many login attempts"
- **Typy:**
  - LoginFormState (interface do zarządzania stanem formularza)
  - LoginError (interface dla błędów)
- **Propsy:** Brak - komponent jest samodzielny

### EmailInput (React - src/components/LoginForm.tsx)

- **Opis komponentu:** Pole input do wprowadzenia emaila. Część komponentu LoginForm, zajmuje się renderowaniem pola input z labelą, walidacją formatem i wyświetlaniem błędów walidacji.
- **Główne elementy:**
  - Label z tekstem "Email"
  - Input type="email" z placeholderem
  - Inline komunikat błędu (gdy email jest nieprawidłowy)
- **Obsługiwane interakcje:**
  - Zmiana wartości w polu
  - Walidacja on blur (po opuszczeniu pola)
  - Wyświetlanie błędu walidacji
- **Obsługiwana walidacja:**
  - Format email (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
  - Wymagane pole
- **Typy:** Brak specjalnych typów
- **Propsy:**
  - `value: string` - wartość pola
  - `onChange: (value: string) => void` - callback do zmiany wartości
  - `onBlur: () => void` - callback on blur
  - `error?: string` - błąd do wyświetlenia

### PasswordInput (React - src/components/LoginForm.tsx)

- **Opis komponentu:** Pole input do wprowadzenia hasła. Część komponentu LoginForm. Zawiera toggle do pokazania/ukrycia hasła.
- **Główne elementy:**
  - Label z tekstem "Hasło"
  - Input type="password" (lub type="text" gdy jest visible)
  - Przycisk toggle do pokazania/ukrycia hasła
  - Inline komunikat błędu
- **Obsługiwane interakcje:**
  - Zmiana wartości w polu
  - Toggle widoczności hasła
  - Walidacja on blur
  - Wysłanie formularza na Enter
- **Obsługiwana walidacja:**
  - Hasło wymagane
  - Minimum 6 znaków
- **Typy:** Brak specjalnych typów
- **Propsy:**
  - `value: string` - wartość pola
  - `onChange: (value: string) => void` - callback do zmiany
  - `onBlur: () => void` - callback on blur
  - `error?: string` - błąd do wyświetlenia
  - `onEnter?: () => void` - callback na Enter

### LoginButton (React - src/components/LoginForm.tsx)

- **Opis komponentu:** Przycisk wysyłający formularz logowania. Pokazuje stan ładowania podczas wysyłania żądania.
- **Główne elementy:**
  - Przycisk HTML z tekstem "Zaloguj się"
  - Loading spinner gdy isLoading = true
  - Disabled stan podczas ładowania
- **Obsługiwane interakcje:**
  - Click - wysłanie formularza
- **Obsługiwana walidacja:** Przycisk jest disabled gdy formularza jest wysyłany (isLoading = true) lub gdy dane są nieprawidłowe
- **Typy:** Brak specjalnych typów
- **Propsy:**
  - `isLoading: boolean` - czy formularz jest wysyłany
  - `isDisabled: boolean` - czy przycisk powinien być disabled
  - `onClick: () => void` - callback na click

### SignupLink (React - src/components/LoginForm.tsx)

- **Opis komponentu:** Link do strony rejestracji. Prosty komponent tekstowy z linkiem.
- **Główne elementy:**
  - Tekst "Nie masz konta?"
  - Link do `/signup`
  - Tekst linku "Zarejestruj się"
- **Obsługiwane interakcje:** Nawigacja na stronę rejestracji
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak specjalnych typów
- **Propsy:** Brak

## 5. Typy

### LoginFormState

```typescript
interface LoginFormState {
  email: string;
  password: string;
  emailError?: string;
  passwordError?: string;
  generalError?: string;
  isLoading: boolean;
  touched: {
    email: boolean;
    password: boolean;
  };
}
```

### LoginError

```typescript
interface LoginError {
  code?: string;
  message: string;
  field?: "email" | "password" | "general";
}
```

### AuthResponse (z Supabase)

```typescript
interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}
```

Gdzie `User`, `Session` i `AuthError` to typy z `@supabase/supabase-js`.

## 6. Zarządzanie stanem

Stan formularza jest zarządzany przy użyciu `useState` w komponencie LoginForm. Wymagany jest customowy hook `useLoginForm` do zarządzania logiką walidacji i przesyłania danych.

### useLoginForm Hook

- **Plik:** `src/components/hooks/useLoginForm.ts`
- **Cel:** Separacja logiki zarządzania stanem formularza od widoku komponentu
- **Funkcjonalność:**
  - Zarządzanie stanem formularza (email, password, errors, loading)
  - Walidacja pól
  - Wysyłanie żądania logowania do API `/api/auth/login`
  - Obsługa błędów
  - Redirect po pomyślnym zalogowaniu
- **Zwracane wartości:**
  - `state: LoginFormState` - obecny stan formularza
  - `handleEmailChange: (value: string) => void` - zmiana emaila
  - `handlePasswordChange: (value: string) => void` - zmiana hasła
  - `handleBlur: (field: 'email' | 'password') => void` - obsługa blur
  - `handleSubmit: () => Promise<void>` - wysłanie formularza
  - `isFormValid: boolean` - czy formularz jest poprawny

## 7. Integracja API

### Endpoint Logowania

- **Endpoint:** POST `/api/auth/login`
- **Plik do implementacji:** `src/pages/api/auth/login.ts`
- **Typ żądania:** `LoginRequest` (email, password)
- **Typ odpowiedzi:** `{ user: UserProfileDto; session: { accessToken: string } }` lub błąd

### LoginRequest

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### Zod Schema

```typescript
const LoginRequestSchema = z.object({
  email: z.string().email("Email jest wymagany i musi być prawidłowy"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});
```

### Logika API Endpointu

1. Walidacja requestu (email, password)
2. Pobranie Supabase client z contextu
3. Wysłanie `signInWithPassword` do Supabase
4. Obsługa błędów Supabase (nieistniejący email, błędne hasło, account not confirmed, too many login attempts)
5. Pobranie profilu użytkownika z `user_profiles`
6. Zwrócenie danych użytkownika i sessji

## 8. Interakcje użytkownika

1. **Otwarcie strony `/login`**
   - Wyświetlony jest formularz logowania z polami email i hasło

2. **Wpisanie emaila**
   - Wartość jest zapisywana w stanie
   - Na blur pola - walidacja formatem email
   - Wyświetlenie błędu "Email jest wymagany i musi być prawidłowy" (jeśli nieprawidłowy)

3. **Wpisanie hasła**
   - Wartość jest zapisywana w stanie
   - Możliwość toggle widoczności hasła
   - Na Enter - próba wysłania formularza

4. **Klik na "Zaloguj się"**
   - Walidacja obu pól
   - Jeśli валідне - wysłanie żądania do API
   - Wyświetlenie loadera w przycisku
   - Przycisk jest disabled podczas wysyłania

5. **Pomyślne zalogowanie**
   - Toast notification "Pomyślnie zalogowano"
   - Redirect na `/dashboard`
   - Sesja użytkownika jest przechowywana

6. **Błąd logowania (np. błędne hasło)**
   - Toast notification z opisem błędu
   - Pole hasło jest wyczyszczane
   - Fokus przesuwa się na pole hasła

7. **Klik na "Zarejestruj się"**
   - Nawigacja na stronę `/signup`

## 9. Warunki i walidacja

### Walidacja po stronie frontendu

1. **Email:**
   - Wymagane pole
   - Format: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
   - Walidacja on blur
   - Błąd: "Email jest wymagany i musi być prawidłowy"

2. **Hasło:**
   - Wymagane pole
   - Minimum 6 znaków
   - Walidacja on blur
   - Błąd: "Hasło jest wymagane" lub "Hasło musi mieć co najmniej 6 znaków"

3. **Przycisk "Zaloguj się":**
   - Enabled tylko gdy oba pola są poprawne
   - Disabled podczas wysyłania (isLoading = true)

### Walidacja po stronie API

1. **Email:**
   - Musi być poprawnym adresem email (zod validation)
   - Musi istnieć w bazie danych

2. **Hasło:**
   - Musi mieć minimum 6 znaków (zod validation)
   - Musi być poprawnym hasłem dla danego email (Supabase validation)

3. **Konto użytkownika:**
   - Musi być potwierdzone (jeśli wymagane)
   - Nie może być zablokowane (brute force protection)

## 10. Obsługa błędów

### Błędy Walidacji Formularza (Frontend)

- **Zła format emaila:** Wyświetlenie inline błędu przy polu email
- **Puste hasło:** Wyświetlenie inline błędu przy polu hasła
- **Hasło za krótkie:** Wyświetlenie inline błędu przy polu hasła

### Błędy API

1. **"Invalid login credentials"** (Supabase)
   - Kod: 400
   - Toast notification: "Błędny email lub hasło"
   - Akcja: Wyczyszczenie pola hasła, fokus na hasło

2. **"Email not confirmed"** (Supabase)
   - Kod: 400
   - Toast notification: "Potwierdź swój email przed zalogowaniem"
   - Akcja: Link do ponownego wysłania emaila potwierdzającego

3. **"Too many login attempts"** (Supabase)
   - Kod: 429
   - Toast notification: "Za wiele prób logowania. Spróbuj później."
   - Akcja: Disable form na 60 sekund

4. **Network Error**
   - Toast notification: "Błąd połączenia. Spróbuj jeszcze raz."
   - Akcja: Zatrzymanie loading stanu

5. **Unknown Error**
   - Toast notification: "Coś poszło nie tak. Spróbuj jeszcze raz."
   - Akcja: Zatrzymanie loading stanu, logowanie do konsoli

### Scenariusze Brzegowe

- **Pusty formularz:** Przycisk jest disabled, komunikat o wymaganych polach
- **Użytkownik nie istnieje:** Generyczny komunikat "Błędny email lub hasło" (ze względów bezpieczeństwa)
- **Konto niezaaktywne:** Komunikat z linkiem do reactivation

## 11. Kroki implementacji

### Krok 1: Stworzenie strony Astro `/login`

- Utwórz plik `src/pages/login.astro`
- Skonfiguruj layout (bez headera i footera z landing page)
- Dodaj redirect middleware: jeśli user jest zalogowany, redirect na `/dashboard`

### Krok 2: Stworzenie hook'a useLoginForm

- Utwórz plik `src/components/hooks/useLoginForm.ts`
- Zaimplementuj zarządzanie stanem formularza (useState)
- Dodaj funkcje walidacji dla emaila i hasła
- Dodaj funkcję `handleSubmit` do wysłania żądania do API

### Krok 3: Stworzenie komponentu LoginForm

- Utwórz plik `src/components/LoginForm.tsx` (React component)
- Zaimplementuj strukturę formularza z Card, Input, Button z shadcn/ui
- Użyj hook'a `useLoginForm`
- Dodaj walidację inline i toast notifications
- Zaimplementuj toggle widoczności hasła

### Krok 4: Stworzenie API endpointu `/api/auth/login`

- Utwórz plik `src/pages/api/auth/login.ts`
- Zaimplementuj Zod schema do walidacji requestu
- Dodaj logikę `signInWithPassword` z Supabase
- Obsłuż błędy z Supabase (invalid credentials, not confirmed, too many attempts)
- Pobranie profilu użytkownika
- Zwrócenie odpowiedzi z user i session

### Krok 5: Testowanie

- Napisz unit testy dla hook'a `useLoginForm` (vitest)
- Napisz unit testy dla API endpointu `src/pages/api/auth/login.test.ts`
- Testy należy mieć dla:
  - Walidacji emaila
  - Walidacji hasła
  - Pomyślnego logowania
  - Błędnych danych
  - Błędów API

### Krok 6: Integracja z istniejącą aplikacją

- Dodaj link do strony logowania na landing page (w header)
- Dodaj link do rejestracji z strony logowania
- Walidacja middleware - upewnij się, że `/login` nie jest dostępny dla zalogowanych użytkowników
- Testowanie flow: landing page → logowanie → dashboard

### Krok 7: Poprawy i optymalizacje

- Code review
- Walidacja dostępności (ARIA labels, aria-live, aria-describedby)
- Optymalizacja wydajności (memoization komponentów jeśli potrzebna)
- Dark mode - walidacja że formularz wygląda dobrze w dark mode
