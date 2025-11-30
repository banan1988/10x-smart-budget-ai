# Plan implementacji widoku Profilu

## 1. Przegląd
Widok Profilu (`/profile`) to strona przeznaczona dla zalogowanych użytkowników, na której wyświetlane są kluczowe informacje o ich koncie. Widok zawiera dane użytkownika pobrane z systemu autentykacji oraz dane z profilu użytkownika (nickname, preferencje). Stanowi punkt wejściowy do zarządzania kontem i zawiera link do bardziej zaawansowanych opcji edycji dostępnych w panelu Ustawień (`/profile/settings`).

## 2. Routing widoku
- **Ścieżka:** `/profile`
- **Dostęp:** Widok będzie dostępny tylko dla zalogowanych użytkowników. Dostęp do ścieżki będzie chroniony przez middleware weryfikujący sesję użytkownika.
- **Uwagi:** Jeśli użytkownik nie jest zalogowany, middleware automatycznie przekieruje go na stronę logowania (`/login`).

## 3. Struktura komponentów
Widok zostanie zaimplementowany jako strona Astro (`profile.astro`), która będzie renderować komponenty React do obsługi interaktywnych elementów.

```
ProfilePage.astro
└── ProfileView.tsx
    ├── ProfileCard.tsx
    └── ProfileActions.tsx
        └── Button (Shadcn/ui)
```

## 4. Szczegóły komponentów

### `ProfilePage.astro`
- **Opis:** Główny plik strony, który definiuje layout i integruje komponenty klienckie. Pobiera dane profilu użytkownika i dane sesji po stronie serwera i przekazuje je do komponentu `ProfileView`.
- **Główne elementy:**
    - `Layout.astro` jako główny szablon strony.
    - Sekcja `<main>` z semantycznym tagiem `role="main"`.
    - Komponent `<ProfileView client:load />` do renderowania interfejsu.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji; deleguje renderowanie do komponentów potomnych.
- **Obsługiwana walidacja:** Sprawdzenie, czy dane profilu zostały pobrane; obsługa przypadku, gdy profil nie istnieje.
- **Typy:** `UserProfileDto`, `ProfilePageVM`.
- **Propsy:** Brak.

### `ProfileView.tsx`
- **Opis:** Komponent React główny dla widoku profilu. Odpowiada za renderowanie podstawowych informacji o użytkowniku oraz linków do akcji.
- **Główne elementy:**
    - `<ProfileCard />` - komponent wyświetlający dane profilu w postaci karty.
    - `<ProfileActions />` - komponent zawierający przyciski i linki akcji.
    - Elementy HTML do strukturyzacji zawartości (sekcje, nagłówki).
- **Obsługiwane interakcje:** Brak stanu lokalnego; wszystkie interakcje są obsługiwane przez komponenty potomne.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ProfilePageVM`.
- **Propsy:**
    - `userProfile: ProfilePageVM` - dane profilu użytkownika do wyświetlenia.

### `ProfileCard.tsx`
- **Opis:** Komponent React renderujący kartę (Card z Shadcn/ui) zawierającą informacje o profilu użytkownika. Wyświetla datę rejestracji, email i nickname.
- **Główne elementy:**
    - `Card` (Shadcn/ui) jako główny kontener.
    - `CardHeader` z tytułem "Informacje o profilu".
    - `CardContent` zawierające listę pól z danymi (email, nickname, data rejestracji).
    - Elementy HTML (`<div>`, `<p>`, `<span>`) do strukturyzacji informacji.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Obsługa przypadku, gdy `nickname` ma wartość `null` (wyświetlenie tekstu "Nie ustawiono").
- **Typy:** `ProfileCardData`.
- **Propsy:**
    - `email: string` - email użytkownika.
    - `nickname: string | null` - nickname użytkownika lub null.
    - `registeredAt: string` - data rejestracji użytkownika w formacie ISO.

### `ProfileActions.tsx`
- **Opis:** Komponent React zawierający przyciski i linki akcji dostępne dla użytkownika z widoku profilu.
- **Główne elementy:**
    - `Button` (Shadcn/ui) do przejścia do `/profile/settings`.
    - `Separator` (Shadcn/ui) do wizualnego rozdzielenia sekcji.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Edytuj ustawienia" przekierowuje do `/profile/settings`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

### `UserProfileDto` (DTO - Data Transfer Object)
Typ danych zwracany przez endpoint `/api/user/profile`. Używany do komunikacji między backendem a frontendem.
```typescript
interface UserProfileDto {
  nickname: string | null;
  preferences: Record<string, any> | null;
}
```
- **`nickname`**: Nazwa użytkownika do wyświetlenia. Może być `null`, jeśli nie została ustawiona.
- **`preferences`**: Obiekt z preferencjami użytkownika (np. `{ "theme": "dark" }`). Może być `null`.

### `ProfilePageVM` (ViewModel)
ViewModel używany do przekazywania danych z serwera (Astro) do komponentu React. Zawiera dane profilu oraz dane z sesji użytkownika.
```typescript
interface ProfilePageVM {
  email: string;
  nickname: string | null;
  registeredAt: string; // ISO format: "2025-01-15T10:30:00.000Z"
  preferences: Record<string, any> | null;
}
```
- **`email`**: Email użytkownika pobierany z sesji (Supabase Auth).
- **`nickname`**: Nazwa użytkownika pobierana z profilu. Może być `null`.
- **`registeredAt`**: Data rejestracji użytkownika pobierana z sesji. Format ISO 8601.
- **`preferences`**: Preferencje użytkownika pobierane z profilu. Może być `null`.

### `ProfileCardData` (ViewModel)
ViewModel dla komponentu `ProfileCard`, zawierający dane potrzebne do wyświetlenia karty.
```typescript
interface ProfileCardData {
  email: string;
  nickname: string | null;
  registeredAt: string;
}
```
- **`email`**: Email użytkownika.
- **`nickname`**: Nickname użytkownika lub `null`.
- **`registeredAt`**: Data rejestracji w formacie ISO.

## 6. Zarządzanie stanem
- **`ProfilePage.astro`**: Brak stanu po stronie serwera. Dane są pobierane jednorazowo i przekazywane do komponenty.
- **`ProfileView.tsx`**: Brak stanu lokalnego. Komponent przyjmuje dane jako props i renderuje komponenty potomne.
- **`ProfileCard.tsx`**: Brak stanu lokalnego. Komponent jest czysto prezentacyjny.
- **`ProfileActions.tsx`**: Brak stanu lokalnego. Komponent zawiera statyczne linki i przyciski.

**Niestandardowe hooki:** Nie są wymagane.

## 7. Integracja API

### `GET /api/user/profile`
- **Cel:** Pobranie danych profilu zalogowanego użytkownika.
- **Miejsce wywołania:** Po stronie serwera w `ProfilePage.astro` przed renderowaniem.
- **Typ odpowiedzi (sukces):** `UserProfileDto`
  ```json
  {
    "nickname": "BudżetowyMistrz",
    "preferences": {
      "theme": "dark"
    }
  }
  ```
- **Typ żądania:** `GET` (bez ciała żądania).
- **Warunki:** Wymagana autentykacja (cookie sesji lub authorization header).
- **Akcja po stronie UI:** Dane z odpowiedzi są mapowane na `ProfilePageVM` (w połączeniu z danymi z sesji Astro) i przekazywane jako props do komponentu `ProfileView`.
- **Obsługa błędów:** Patrz sekcja "Obsługa błędów".

## 8. Interakcje użytkownika
1. **Użytkownik wchodzi na `/profile`**: 
   - Widzi kartę z informacjami o swoim profilu (email, nickname, data rejestracji).
   - Widzi przycisk "Edytuj ustawienia".

2. **Użytkownik klika "Edytuj ustawienia"**: 
   - Zostaje przekierowany na `/profile/settings`.

3. **Edytowanie danych profilu** (jeśli będzie zaimplementowane w przyszłości):
   - Na widoku `/profile/settings` użytkownik może edytować swoje dane (np. nickname).

## 9. Warunki i walidacja

### Warunki weryfikacyjne:

1. **Dostęp do widoku:**
   - Middleware Astro (`src/middleware/index.ts`) musi weryfikować, czy `Astro.locals.session` istnieje.
   - Jeśli sesja nie istnieje, użytkownik jest przekierowywany na stronę logowania (`/login`).
   - Status HTTP: Jeśli middleware przekieruje, kod odpowiedzi będzie `302` (redirect) lub `307`.

2. **Pobranie danych profilu:**
   - Endpoint `/api/user/profile` wymaga autentykacji (cookie sesji lub authorization header).
   - Jeśli użytkownik jest zalogowany, serwer zwraca dane profilu.
   - Jeśli użytkownik nie jest zalogowany lub sesja jest nieważna, serwer zwraca `401 Unauthorized`.
   - Jeśli profil nie istnieje dla istniejącego użytkownika, serwer zwraca `404 Not Found`.

3. **Wyświetlanie danych:**
   - Nickname jest opcjonalny; jeśli ma wartość `null`, wyświetlany jest tekst "Nie ustawiono".
   - Email zawsze jest dostępny (pobierany z sesji).
   - Data rejestracji jest zawsze dostępna (pobierana z sesji).

4. **Walidacja po stronie komponentów:**
   - Komponent `ProfileCard` musi obsługiwać przypadek, gdy `nickname` jest `null`.
   - Komponenty React mogą opierać się na Props Drilling (przekazanie props z Astro do React).

## 10. Obsługa błędów

### Scenariusze błędów:

1. **Błąd 401 Unauthorized przy pobieraniu profilu (`GET /api/user/profile`):**
   - **Przyczyna:** Sesja użytkownika jest nieważna lub wygasła.
   - **Działanie:** Middleware powinien już obsłużyć to przypadku, ale jeśli do niego dojdzie, `ProfilePage.astro` powinno zwrócić odpowiedź ze statusem `401` i wyświetlić stronę błędu.
   - **Komunikat dla użytkownika:** Aplikacja wyświetla stronę błędu z informacją "Nieosiągnięty dostęp. Prosimy się zalogować ponownie" z linkiem do `/login`.

2. **Błąd 404 Not Found przy pobieraniu profilu (`GET /api/user/profile`):**
   - **Przyczyna:** Profil użytkownika nie istnieje w bazie danych (rzadki przypadek, ponieważ profil powinien być tworzony automatycznie przy rejestracji).
   - **Działanie:** `ProfilePage.astro` powinno zwrócić odpowiedź ze statusem `404` i wyświetlić stronę błędu.
   - **Komunikat dla użytkownika:** "Profil nie znaleziony. Prosimy skontaktować się z supportem."

3. **Błędy sieciowe lub timeout przy pobieraniu profilu:**
   - **Przyczyna:** Niedostępność serwera lub zbyt długi czas odpowiedzi.
   - **Działanie:** `ProfilePage.astro` może wyświetlić stronę błędu 500 lub zawartość fallback.
   - **Komunikat dla użytkownika:** "Błąd serwera. Spróbuj ponownie później."

4. **Brak danych w odpowiedzi API:**
   - **Przyczyna:** Endpoint zwrócił odpowiedź 200, ale bez wymaganych pól.
   - **Działanie:** Aplikacja powinna obsłużyć to poprzez walidację struktury odpowiedzi (np. za pomocą Zod).
   - **Komunikat dla użytkownika:** Wyświetlenie wartości domyślnych lub komunikatu o błędzie walidacji.

## 11. Kroki implementacji

1. **Aktualizacja middleware:** Zaktualizować `src/middleware/index.ts`, aby chronić ścieżkę `/profile` (jeśli nie jest już chroniona).

2. **Definiowanie typów:** Dodać typy `UserProfileDto`, `ProfilePageVM` i `ProfileCardData` do `src/types.ts`.

3. **Utworzenie strony Astro:** 
   - Stworzyć plik `src/pages/profile.astro`.
   - Zaimplementować logikę pobierania danych z `/api/user/profile` po stronie serwera.
   - Zamieniać dane API na `ProfilePageVM` (w połączeniu z danymi z `Astro.locals.session`).
   - Renderować komponent `<ProfileView client:load />` z danymi.

4. **Utworzenie komponentu `ProfileView.tsx`:**
   - Stworzyć plik `src/components/ProfileView.tsx`.
   - Przyjmować `userProfile: ProfilePageVM` jako props.
   - Renderować komponenty potomne: `<ProfileCard />` i `<ProfileActions />`.

5. **Utworzenie komponentu `ProfileCard.tsx`:**
   - Stworzyć plik `src/components/ProfileCard.tsx`.
   - Przyjmować props: `email`, `nickname`, `registeredAt`.
   - Renderować kartę z informacjami o profilu przy użyciu komponentów z Shadcn/ui.
   - Obsłużyć wyświetlanie "Nie ustawiono" jeśli `nickname` jest `null`.

6. **Utworzenie komponentu `ProfileActions.tsx`:**
   - Stworzyć plik `src/components/ProfileActions.tsx`.
   - Renderować przycisk "Edytuj ustawienia" z linkiem do `/profile/settings`.

7. **Integracja komponentów:**
   - Upewnić się, że komponenty React (`ProfileView`, `ProfileCard`, `ProfileActions`) są ładowane po stronie klienta (`client:load` w Astro).
   - Obsłużyć style i dostępność (ARIA) zgodnie z wytycznymi w Copilot Instructions.

8. **Obsługa błędów:**
   - Dodać obsługę błędów 401, 404 i innych w `ProfilePage.astro`.
   - Wyświetlać odpowiednie strony błędów lub komunikaty.

9. **Testowanie:**
   - Przetestować ręcznie cały przepływ:
     - Zalogowanie i przejście do `/profile`.
     - Wyświetlenie poprawnych danych profilu.
     - Kliknięcie przycisku "Edytuj ustawienia" i przejście do `/profile/settings`.
   - Przetestować przypadki błędów (wylogowanie, wygaśnięcie sesji).

10. **Przegląd kodu i dostępności:**
    - Przegląd kodu pod kątem zgodności z wytycznymi dostępności (ARIA, semantyczne tagi HTML).
    - Przegląd pod kątem wydajności i optymalizacji.


