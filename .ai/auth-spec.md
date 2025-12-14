### Specyfikacja Techniczna: Moduł Uwierzytelniania i Autoryzacji

Poniższy dokument opisuje architekturę i implementację funkcjonalności związanych z rejestracją, logowaniem, odzyskiwaniem hasła oraz zarządzaniem sesją użytkownika w aplikacji SmartBudgetAI, zgodnie z wymaganiami z pliku `prd.md` i z wykorzystaniem stacku technologicznego opisanego w `tech-stack.md`.

---

### 1. Architektura Interfejsu Użytkownika

Interfejs użytkownika zostanie podzielony na komponenty publiczne (dostępne dla niezalogowanych użytkowników) i prywatne (wymagające aktywnej sesji).

#### **1.1. Strony i Layouty**

- **`src/layouts/Layout.astro`**: Główny layout aplikacji zostanie rozszerzony o logikę warunkowego renderowania komponentów w zależności od statusu uwierzytelnienia użytkownika.
  - **Tryb `non-auth`**: Wyświetla uproszczony nagłówek (`AppHeader`) z linkami do `/login` i `/register` oraz stopkę (`AppFooter`). Główne menu nawigacyjne (`AppSidebar`) jest ukryte.
  - **Tryb `auth`**: Wyświetla pełny `AppHeader` z danymi zalogowanego użytkownika (np. awatar, nazwa) i przyciskiem "Wyloguj", a także `AppSidebar` z nawigacją do chronionych sekcji (`/dashboard`, `/transactions`, `/profile`).
- **`src/pages/`**:
  - **`index.astro`**: Strona główna (landing page), publicznie dostępna.
  - **`login.astro`**: Publiczna strona zawierająca komponent `LoginForm`. Po pomyślnym zalogowaniu, użytkownik jest przekierowywany do `/dashboard`.
  - **`register.astro`**: Publiczna strona zawierająca komponent `RegisterForm`. Po pomyślnej rejestracji, Supabase wysyła e-mail weryfikacyjny, a użytkownik jest informowany o konieczności potwierdzenia adresu e-mail.
  - **`forgot-password.astro` (nowa)**: Publiczna strona z formularzem do inicjowania procesu resetowania hasła. Użytkownik podaje swój adres e-mail.
  - **`profile/reset-password.astro` (nowa)**: Strona, na którą trafia użytkownik po kliknięciu w link resetujący z maila. Będzie zawierać formularz do ustawienia nowego hasła. Dostęp do niej jest uwarunkowany specjalnym tokenem od Supabase, który tworzy tymczasową sesję uwierzytelniającą.

#### **1.2. Komponenty React (`src/components/`)**

- **`LoginForm.tsx`**:
  - **Odpowiedzialność**: Obsługa formularza logowania, walidacja po stronie klienta (np. czy pola nie są puste, czy e-mail ma poprawny format), komunikacja z endpointem `/api/auth/login`.
  - **Pola**: `email`, `password`.
  - **Walidacja**: Użycie biblioteki `zod` do walidacji schematu. Błędy będą wyświetlane pod odpowiednimi polami formularza.
  - **Komunikaty**: Wyświetlanie komunikatów o błędach (np. "Nieprawidłowy e-mail lub hasło") oraz sukcesie (przekierowanie).
- **`RegisterForm.tsx`**:
  - **Odpowiedzialność**: Obsługa formularza rejestracji, walidacja po stronie klienta.
  - **Pola**: `email`, `password`, `confirmPassword`.
  - **Walidacja**: Sprawdzanie zgodności haseł, minimalnej długości hasła oraz formatu e-mail.
  - **Komunikaty**: Informowanie o błędach walidacji oraz o konieczności potwierdzenia adresu e-mail po pomyślnej rejestracji.
- **`ForgotPasswordForm.tsx` (nowy)**:
  - **Odpowiedzialność**: Formularz do wysyłania prośby o reset hasła.
  - **Pola**: `email`.
  - **Logika**: Po walidacji i wysłaniu formularza, komponent komunikuje się z `/api/auth/forgot-password`. Wyświetla komunikat o wysłaniu instrukcji na podany adres e-mail.
- **`ResetPasswordForm.tsx` (nowy)**:
  - **Odpowiedzialność**: Formularz do ustawiania nowego hasła.
  - **Pola**: `newPassword`, `confirmNewPassword`.
  - **Logika**: Komponent będzie wywoływany na stronie `profile/reset-password.astro`. Po pomyślnej zmianie hasła, użytkownik jest informowany o sukcesie i zachęcany do zalogowania się.

#### **1.3. Scenariusze Użytkownika**

1.  **Logowanie**: Użytkownik wchodzi na `/login`, wypełnia formularz, dane są wysyłane do `/api/auth/login`. Po sukcesie, serwer ustawia cookie sesji, a klient przekierowuje na `/dashboard`.
2.  **Rejestracja**: Użytkownik wchodzi na `/register`, wypełnia formularz. Po walidacji, dane trafiają do `/api/auth/register`. Użytkownik otrzymuje e-mail z linkiem weryfikacyjnym.
3.  **Wylogowanie**: Użytkownik klika "Wyloguj". Następuje wywołanie `/api/auth/logout`, które usuwa sesję po stronie serwera. Klient przekierowuje na `/login`.
4.  **Reset Hasła**: Użytkownik na `/forgot-password` podaje e-mail. Otrzymuje link, który prowadzi do `/profile/reset-password`. Ustawia nowe hasło.

---

### 2. Logika Backendowa

Logika backendowa zostanie zrealizowana za pomocą endpointów API w Astro, które będą komunikować się z Supabase.

#### **2.1. Struktura Endpointów API (`src/pages/api/auth/`)**

Wszystkie endpointy będą miały `export const prerender = false;`.

- **`login.ts` (`POST`)**:
  - **Kontrakt (Request)**: `z.object({ email: z.string().email(), password: z.string() })`.
  - **Logika**: Wywołuje `supabase.auth.signInWithPassword()`. W przypadku sukcesu, zwraca `200 OK`. W przypadku błędu (np. nieprawidłowe dane), zwraca `401 Unauthorized`.
- **`register.ts` (`POST`)**:
  - **Kontrakt (Request)**: `z.object({ email: z.string().email(), password: z.string().min(8) })`.
  - **Logika**: Wywołuje `supabase.auth.signUp()`. W przypadku sukcesu, zwraca `201 Created`. Jeśli użytkownik już istnieje, zwraca `409 Conflict`.
- **`logout.ts` (`POST`)**:
  - **Wymaga uwierzytelnienia**.
  - **Logika**: Wywołuje `supabase.auth.signOut()`. Usuwa cookie sesyjne. Zwraca `200 OK`.
- **`callback.ts` (`GET`)**:
  - **Logika**: Standardowy endpoint dla Supabase Auth do obsługi przekierowań po uwierzytelnieniu (np. po kliknięciu w link weryfikacyjny). Wymienia kod autoryzacyjny na sesję.
- **`forgot-password.ts` (`POST`)**:
  - **Kontrakt (Request)**: `z.object({ email: z.string().email() })`.
  - **Logika**: Wywołuje `supabase.auth.resetPasswordForEmail()`, podając URL do strony resetowania hasła (`/profile/reset-password`). Zawsze zwraca `200 OK`, aby nie ujawniać, czy dany e-mail istnieje w bazie.
- **`reset-password.ts` (`POST`)**:
  - **Wymaga uwierzytelnienia** (specjalnej sesji uzyskanej z tokenu w linku resetującym).
  - **Kontrakt (Request)**: `z.object({ newPassword: z.string().min(8) })`.
  - **Logika**: Wywołuje `supabase.auth.updateUser()` do zmiany hasła. Zwraca `200 OK` lub błąd `400 Bad Request`.
- **`delete-account.ts` (`DELETE`, nowa ścieżka `src/pages/api/user/account.ts`)**:
  - **Wymaga uwierzytelnienia**.
  - **Logika**: Endpoint będzie wymagał dodatkowego potwierdzenia (np. hasła). Po pomyślnej weryfikacji, wywołuje funkcję RPC w Supabase (`delete_user_account`), która usuwa wszystkie dane użytkownika oraz jego konto w `auth.users`. Zwraca `200 OK` lub odpowiedni błąd.

#### **2.2. Walidacja i Obsługa Błędów**

- **Walidacja**: Każdy endpoint API będzie używał `zod` do walidacji ciała żądania. W przypadku błędu walidacji, serwer zwróci `400 Bad Request` z informacją o nieprawidłowych danych.
- **Obsługa Wyjątków**: Błędy z Supabase (np. `AuthApiError`) będą przechwytywane i mapowane na odpowiednie kody statusu HTTP (np. `401`, `409`, `500`).

---

### 3. System Autentykacji i Autoryzacji

System będzie oparty na Supabase Auth i middleware w Astro.

#### **3.1. Middleware (`src/middleware/index.ts`)**

Middleware będzie kluczowym elementem chroniącym zasoby aplikacji.

- **Logika Działania**:
  1.  Dla każdego żądania przychodzącego do serwera, middleware tworzy serwerowego klienta Supabase.
  2.  Sprawdza, czy w `Astro.cookies` znajduje się token sesji Supabase.
  3.  Próbuje pobrać dane użytkownika za pomocą `supabase.auth.getUser()`.
  4.  **Jeśli użytkownik jest zalogowany**:
      - Dane użytkownika (w tym `id` i `role` z `app_metadata`) są dołączane do `context.locals.user`.
      - Jeśli użytkownik próbuje uzyskać dostęp do ścieżki `/admin/**`, a jego rola to nie `admin`, jest przekierowywany na `/dashboard` z komunikatem o braku uprawnień.
      - Jeśli użytkownik jest zalogowany i próbuje wejść na `/login` lub `/register`, jest automatycznie przekierowywany na `/dashboard`.
  5.  **Jeśli użytkownik nie jest zalogowany**:
      - `context.locals.user` jest ustawiane na `null`.
      - Jeśli żądanie dotyczy chronionej ścieżki (np. `/dashboard`, `/transactions`, `/api/transactions`), użytkownik jest przekierowywany na `/login`.
  6.  Żądanie jest przekazywane dalej do odpowiedniej strony lub endpointu API.

#### **3.2. Zarządzanie Rolami**

- Rola użytkownika (`user` lub `admin`) będzie przechowywana w polu `app_metadata` w Supabase Auth.
- Domyślnie każdy nowo zarejestrowany użytkownik otrzymuje rolę `user`.
- Middleware (`src/middleware/index.ts`) będzie odpowiedzialny za egzekwowanie dostępu na podstawie roli, blokując dostęp do ścieżek `/admin/**` i `/api/admin/**` dla użytkowników bez roli `admin`.

#### **3.3. Integracja z Supabase**

- **Klient Supabase**: Serwerowy klient Supabase będzie tworzony w middleware i przekazywany przez `context.locals.supabase`, aby był dostępny w endpointach API. Zapewni to, że wszystkie operacje na bazie danych będą wykonywane w kontekście zalogowanego użytkownika, co jest kluczowe dla działania Row Level Security.
- **Po stronie klienta**: Komponenty React będą używać klienckiego SDK Supabase (`@supabase/supabase-js`) do wywoływania funkcji `auth`, ale nie będą bezpośrednio komunikować się z bazą danych. Zamiast tego, będą wysyłać żądania do własnych endpointów API (`/api/...`).
