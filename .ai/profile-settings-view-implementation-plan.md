# Plan implementacji widoku Ustawień Profilu

## 1. Przegląd
Widok Ustawień Profilu (`/profile/settings`) jest zaawansowaną stronę zarządzania kontem użytkownika. Umożliwia użytkownikom edycję danych profilu (na przykład nickname) oraz trwałe usunięcie swojego konta wraz ze wszystkimi powiązanymi danymi, zgodnie z wymogami RODO. Proces usuwania konta jest zabezpieczony dialogiem potwierdzenia, aby zapobiec przypadkowym działaniom.

## 2. Routing widoku
- **Ścieżka:** `/profile/settings`
- **Dostęp:** Widok będzie dostępny tylko dla zalogowanych użytkowników. Dostęp do ścieżki będzie chroniony przez middleware weryfikujący sesję użytkownika.
- **Uwagi:** Jeśli użytkownik nie jest zalogowany, middleware automatycznie przekieruje go na stronę logowania (`/login`).
- **Ścieżka nadrzędna:** Widok należy do sekcji zarządzania profilem (`/profile/*`).

## 3. Struktura komponentów
Widok zostanie zaimplementowany jako strona Astro (`profile/settings.astro`), która będzie renderować komponenty React do obsługi interaktywnych elementów.

```
ProfileSettingsPage.astro
└── ProfileSettingsView.tsx
    ├── EditProfileSection.tsx
    │   ├── Input (Shadcn/ui)
    │   ├── Label (Shadcn/ui)
    │   └── Button (Shadcn/ui)
    └── DeleteAccountSection.tsx
        ├── Button (destructive variant, Shadcn/ui)
        └── DeleteAccountDialog.tsx
            └── AlertDialog (Shadcn/ui)
                └── Button (Shadcn/ui)
```

## 4. Szczegóły komponentów

### `ProfileSettingsPage.astro`
- **Opis:** Główny plik strony, który definiuje layout i integruje komponenty klienckie. Pobiera dane profilu użytkownika po stronie serwera i przekazuje je do komponentu `ProfileSettingsView`.
- **Główne elementy:**
    - `Layout.astro` jako główny szablon strony.
    - Sekcja `<main>` z semantycznym tagiem `role="main"`.
    - Komponent `<ProfileSettingsView client:load />` do renderowania interfejsu.
    - Breadcrumbs lub nagłówek strony do navigacji (opcjonalnie).
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji; deleguje renderowanie do komponentów potomnych.
- **Obsługiwana walidacja:** Sprawdzenie, czy dane profilu zostały pobrane; obsługa przypadku, gdy profil nie istnieje.
- **Typy:** `UserProfileDto`, `ProfileSettingsPageVM`.
- **Propsy:** Brak.

### `ProfileSettingsView.tsx`
- **Opis:** Komponent React główny dla widoku ustawień profilu. Organizuje i renderuje dwie główne sekcje: edycję profilu oraz usuwanie konta.
- **Główne elementy:**
    - `<EditProfileSection />` - sekcja do edycji danych profilu.
    - `<DeleteAccountSection />` - sekcja z opcją usunięcia konta.
    - Elementy HTML do strukturyzacji zawartości (sekcje, nagłówki, separatory).
- **Obsługiwane interakcje:** Brak stanu lokalnego; wszystkie interakcje są obsługiwane przez komponenty potomne.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `ProfileSettingsPageVM`.
- **Propsy:**
    - `userProfile: ProfileSettingsPageVM` - dane profilu użytkownika.

### `EditProfileSection.tsx`
- **Opis:** Komponent React do edycji danych profilu użytkownika (na przykład nickname). Zawiera pola formularza, przyciski akcji oraz obsługę walidacji i wysyłania danych.
- **Główne elementy:**
    - `<form>` - formularz do edycji profilu.
    - `<label>` + `<input>` (Shadcn/ui) - pola edycji (na przykład nickname).
    - `<Button>` (Shadcn/ui) z wariantem `default` do zapisania zmian.
    - `<Button>` (Shadcn/ui) z wariantem `outline` do anulowania zmian.
    - Elementy HTML do strukturyzacji formularza (fieldset, legend).
    - Komunikat o stanie (ładowanie, sukces, błąd).
- **Obsługiwane interakcje:**
    - Użytkownik edytuje pole nickname.
    - Użytkownik klika "Zapisz" - formularz jest wysyłany na serwer.
    - Użytkownik klika "Anuluj" - zmiany są wycofywane, formularz przywraca wartości oryginalne.
    - Po zapisaniu, wyświetlany jest toast z komunikatem o sukcesie lub błędzie.
- **Obsługiwana walidacja:**
    - Nickname: string, opcjonalnie; maksimum 50 znaków; dopuszczalne znaki: litery, cyfry, spacje, myślniki i podkreślenia.
    - Nickname nie może być pusty, jeśli użytkownik zacznie edycję.
    - Walidacja po stronie klienta: regex sprawdzający format.
    - Walidacja po stronie serwera: dodatkowa walidacja i sanitacja danych.
- **Typy:** `EditProfileFormData`, `ValidationError`.
- **Propsy:**
    - `initialNickname: string | null` - początkowa wartość nickname.
    - `onProfileUpdated?: (updatedNickname: string) => void` - callback wywoływany po pomyślnym zaktualizowaniu profilu.

### `DeleteAccountSection.tsx`
- **Opis:** Komponent React zawierający przycisk do usunięcia konta oraz delegujący zarządzanie dialogiem potwierdzenia do komponentu `DeleteAccountDialog`.
- **Główne elementy:**
    - `<Button variant="destructive">` (Shadcn/ui) do otwarcia dialogu usuwania.
    - Tekst ostrzegawczy opisujący konsekwencje usunięcia konta.
    - Komponent `<DeleteAccountDialog />`.
- **Obsługiwane interakcje:**
    - Użytkownik klika "Usuń konto" - otwiera się dialog potwierdzenia.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `DeleteAccountDialog.tsx`
- **Opis:** Komponent React zarządzający procesem usunięcia konta. Zawiera dialog potwierdzenia z ostrzeżeniami i przyciskami akcji.
- **Główne elementy:**
    - `<AlertDialog>` (Shadcn/ui) - dialog potwierdzenia.
    - `<AlertDialogHeader>` - nagłówek dialogu z tytułem.
    - `<AlertDialogDescription>` - opis ostrzegawczy (nieodwracalność, utrata danych).
    - `<AlertDialogAction>` - przycisk potwierdzenia usunięcia (wariant `destructive`).
    - `<AlertDialogCancel>` - przycisk anulowania.
    - Wskaźnik ładowania podczas wysyłania żądania.
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku "Usuń konto" w `DeleteAccountSection` otwiera `AlertDialog`.
    - Kliknięcie "Anuluj" w dialogu zamyka go bez zmian.
    - Kliknięcie "Usuń konto" w dialogu uruchamia wywołanie API `DELETE /api/user`.
    - Po pomyślnym usunięciu, użytkownik jest przekierowywany na stronę główną (`/`) z toast powiadomieniem.
- **Obsługiwana walidacja:** Brak (potwierdzenie jest wymagane w dialogu).
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
- **`nickname`**: Nazwa użytkownika do wyświetlenia i edycji. Może być `null`, jeśli nie została ustawiona.
- **`preferences`**: Obiekt z preferencjami użytkownika (np. `{ "theme": "dark" }`). Może być `null`.

### `ProfileSettingsPageVM` (ViewModel)
ViewModel używany do przekazywania danych z serwera (Astro) do komponentu React.
```typescript
interface ProfileSettingsPageVM {
  email: string;
  nickname: string | null;
  registeredAt: string; // ISO format: "2025-01-15T10:30:00.000Z"
  preferences: Record<string, any> | null;
}
```
- **`email`**: Email użytkownika pobierany z sesji (Supabase Auth). Przeznaczony do wyświetlenia, ale nie edycji (w tej wersji).
- **`nickname`**: Nazwa użytkownika pobierana z profilu. Może być `null`.
- **`registeredAt`**: Data rejestracji użytkownika. Format ISO 8601.
- **`preferences`**: Preferencje użytkownika pobierane z profilu. Może być `null`.

### `EditProfileFormData` (ViewModel/Form Data)
Typ danych reprezentujący stan formularza edycji profilu.
```typescript
interface EditProfileFormData {
  nickname: string;
}
```
- **`nickname`**: Bieżąca wartość nickname w formularzu.

### `UpdateProfileRequest` (Request DTO)
Typ danych wysyłany do API przy aktualizacji profilu.
```typescript
interface UpdateProfileRequest {
  nickname: string;
}
```
- **`nickname`**: Nowa wartość nickname do zapisania.

### `UpdateProfileResponse` (Response DTO)
Typ danych zwracany przez API przy pomyślnej aktualizacji profilu.
```typescript
interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    nickname: string;
  };
}
```
- **`success`**: Flaga wskazująca powodzenie operacji.
- **`message`**: Opcjonalny komunikat (na przykład komunikat o błędzie).
- **`data`**: Opcjonalny obiekt zawierający zaktualizowane dane (na przykład nowy nickname).

### `ValidationError` (Error DTO)
Typ danych reprezentujący błędy walidacji.
```typescript
interface ValidationError {
  field: string; // np. "nickname"
  message: string; // np. "Nickname jest zbyt długi. Maksimum 50 znaków."
}
```
- **`field`**: Pole formularza, w którym wystąpił błąd.
- **`message`**: Komunikat błędu.

## 6. Zarządzanie stanem

### `ProfileSettingsPage.astro`
- Brak stanu po stronie serwera. Dane są pobierane jednorazowo i przekazywane do komponentów React.

### `ProfileSettingsView.tsx`
- Brak stanu lokalnego. Komponent przyjmuje dane jako props i renderuje komponenty potomne.

### `EditProfileSection.tsx`
- **Stan lokalny:**
  - `formData: EditProfileFormData` - bieżące dane formularza (nickname).
  - `isLoading: boolean` - wskazuje, czy trwa wysyłanie formularza na serwer.
  - `error: ValidationError | null` - błąd walidacji lub błąd serwera.
  - `successMessage: string | null` - komunikat o sukcesie.
  - `isDirty: boolean` - flaga wskazująca, czy dane w formularzu zostały zmienione.
- **Niestandardowe hooki:** 
  - Można rozważyć stworzenie `useEditProfileForm` do zarządzania stanem formularza i logią walidacji.

### `DeleteAccountSection.tsx`
- Brak stanu lokalnego. Deleguje zarządzanie stanem do `DeleteAccountDialog`.

### `DeleteAccountDialog.tsx`
- **Stan lokalny:**
  - `isOpen: boolean` - zarządza widocznością `AlertDialog`.
  - `isDeleting: boolean` - wskazuje, czy trwa proces usuwania konta.
  - `error: string | null` - komunikat o błędzie (jeśli operacja się nie powiedzie).
- Nie ma potrzeby tworzenia dedykowanego hooka; `useState` jest wystarczający.

## 7. Integracja API

### `GET /api/user/profile`
- **Cel:** Pobranie danych profilu zalogowanego użytkownika.
- **Miejsce wywołania:** Po stronie serwera w `ProfileSettingsPage.astro` przed renderowaniem.
- **Typ żądania:** `GET` (bez ciała żądania).
- **Typ odpowiedzi (sukces):** `UserProfileDto`
  ```json
  {
    "nickname": "BudżetowyMistrz",
    "preferences": {
      "theme": "dark"
    }
  }
  ```
- **Warunki:** Wymagana autentykacja (cookie sesji lub authorization header).
- **Akcja po stronie UI:** Dane z odpowiedzi są mapowane na `ProfileSettingsPageVM` (w połączeniu z danymi z sesji Astro) i przekazywane jako props do komponentu `ProfileSettingsView`.
- **Obsługa błędów:** Patrz sekcja "Obsługa błędów".

### `PUT /api/user/profile` (nowy endpoint)
- **Cel:** Aktualizacja danych profilu zalogowanego użytkownika.
- **Miejsce wywołania:** W komponencie `EditProfileSection.tsx` po kliknięciu przycisku "Zapisz".
- **Typ żądania:** `PUT`
- **Ciało żądania:** `UpdateProfileRequest`
  ```json
  {
    "nickname": "NowyNickname"
  }
  ```
- **Typ odpowiedzi (sukces):** `UpdateProfileResponse` (status: `200 OK`)
  ```json
  {
    "success": true,
    "message": "Profil został zaktualizowany.",
    "data": {
      "nickname": "NowyNickname"
    }
  }
  ```
- **Warunki:** Wymagana autentykacja.
- **Akcja po stronie UI:** 
  - Po pomyślnej aktualizacji, wyświetlany jest toast z komunikatem "Profil zaktualizowany".
  - Flaga `isDirty` jest resetowana.
  - Stan `formData` może być zaktualizowany, aby odzwierciedlić nowe dane.
- **Obsługa błędów:** Patrz sekcja "Obsługa błędów".

### `DELETE /api/user`
- **Cel:** Usunięcie konta zalogowanego użytkownika wraz ze wszystkimi powiązanymi danymi.
- **Miejsce wywołania:** W komponencie `DeleteAccountDialog.tsx` po potwierdzeniu akcji przez użytkownika w dialogu.
- **Typ żądania:** `DELETE` (bez ciała żądania).
- **Typ odpowiedzi (sukces):** `204 No Content` (brak ciała odpowiedzi).
- **Warunki:** Wymagana autentykacja.
- **Akcja po stronie UI:** 
  - Po pomyślnym usunięciu, użytkownik jest wylogowywany.
  - Użytkownik jest przekierowywany na stronę główną (`/`) lub stronę pożegnalną.
  - Wyświetlany jest toast z komunikatem "Konto zostało usunięte. Zostały wylogowani."
- **Obsługa błędów:** Patrz sekcja "Obsługa błędów".

## 8. Interakcje użytkownika

### Przepływ edycji profilu:
1. **Użytkownik wchodzi na `/profile/settings`**: 
   - Widzi sekcję edycji profilu z polem nickname wstępnie wypełnionym bieżącą wartością.
   - Widzi przyciski "Zapisz" (wyłączony do czasu zmiany) i "Anuluj".

2. **Użytkownik edytuje pole nickname**: 
   - Flaga `isDirty` zmienia się na `true`.
   - Przycisk "Zapisz" staje się aktywny.

3. **Użytkownik klika "Zapisz"**: 
   - Formularz jest walidowany po stronie klienta.
   - Jeśli walidacja się nie powiedzie, wyświetlany jest komunikat o błędzie.
   - Jeśli walidacja się powiedzie, wysyłane jest żądanie `PUT /api/user/profile`.
   - Przycisk "Zapisz" staje się nieaktywny, pojawia się wskaźnik ładowania.

4. **Serwer aktualizuje profil**: 
   - Zwraca `200 OK` z zaktualizowanymi danymi.

5. **Po powrocie odpowiedzi**: 
   - Wyświetlany jest toast "Profil został zaktualizowany".
   - Flaga `isDirty` jest resetowana.
   - Przyciski wracają do stanu normalnego.

6. **Użytkownik klika "Anuluj"**: 
   - Formularz powraca do wartości oryginalne.
   - Flaga `isDirty` jest resetowana.

### Przepływ usuwania konta:
1. **Użytkownik widzi przycisk "Usuń konto"** w sekcji usuwania konta.

2. **Użytkownik klika "Usuń konto"**: 
   - Otwiera się dialog potwierdzenia `AlertDialog`.
   - Dialog wyświetla ostrzeżenie o nieodwracalności działania.

3. **Użytkownik klika "Anuluj" w dialogu**: 
   - Dialog zostaje zamknięty bez zmian.

4. **Użytkownik klika "Usuń konto" w dialogu**: 
   - Przycisk staje się nieaktywny.
   - Pojawia się wskaźnik ładowania.
   - Wysyłane jest żądanie `DELETE /api/user`.

5. **Serwer usuwa konto**: 
   - Zwraca `204 No Content`.

6. **Po powrocie odpowiedzi**: 
   - Wyświetlany jest toast "Konto zostało usunięte".
   - Użytkownik jest przekierowywany na stronę główną (`/`).

## 9. Warunki i walidacja

### Warunki weryfikacyjne:

1. **Dostęp do widoku:**
   - Middleware Astro (`src/middleware/index.ts`) musi weryfikować, czy `Astro.locals.session` istnieje.
   - Jeśli sesja nie istnieje, użytkownik jest przekierowywany na stronę logowania (`/login`).
   - Status HTTP: Jeśli middleware przekieruje, kod odpowiedzi będzie `302` (redirect) lub `307`.

2. **Pobranie danych profilu:**
   - Endpoint `/api/user/profile` wymaga autentykacji.
   - Jeśli użytkownik jest zalogowany, serwer zwraca dane profilu.
   - Jeśli profil nie istnieje, serwer zwraca `404 Not Found`.

3. **Walidacja formularza edycji profilu:**
   - **Walidacja po stronie klienta:**
     - Nickname: `string`, opcjonalnie; maksimum 50 znaków.
     - Dopuszczalne znaki: litery (a-z, A-Z), cyfry (0-9), spacje, myślniki (-), podkreślenia (_).
     - Regex: `/^[a-zA-Z0-9\s\-_]{0,50}$/` lub dostosowany do wymagań.
     - Powinno być komunikat o błędzie, jeśli nickname nie spełnia warunków.
   - **Walidacja po stronie serwera:**
     - Serwer waliduje i sanityzuje dane przed zapisaniem.
     - W przypadku błędu walidacji, zwraca `400 Bad Request` z listą błędów.
   - **Przycisk "Zapisz"** jest wyłączony do czasu zmiany danych lub gdy dane nie przeszły walidacji.

4. **Walidacja usuwania konta:**
   - Usuwanie konta wymaga potwierdzenia w dialogu.
   - Po potwierdzeniu, wysyłane jest żądanie `DELETE /api/user`.
   - Serwer musi sprawdzić autentykację przed usunięciem.

## 10. Obsługa błędów

### Scenariusze błędów:

1. **Błąd 401 Unauthorized przy pobieraniu profilu (`GET /api/user/profile`):**
   - **Przyczyna:** Sesja użytkownika jest nieważna lub wygasła.
   - **Działanie:** Middleware powinien już obsłużyć to, ale jeśli do niego dojdzie, `ProfileSettingsPage.astro` powinno zwrócić `401` i wyświetlić stronę błędu.
   - **Komunikat dla użytkownika:** "Dostęp zablokowany. Zaloguj się ponownie."

2. **Błąd 404 Not Found przy pobieraniu profilu:**
   - **Przyczyna:** Profil użytkownika nie istnieje (rzadki przypadek).
   - **Działanie:** `ProfileSettingsPage.astro` powinno zwrócić `404` i wyświetlić stronę błędu.
   - **Komunikat dla użytkownika:** "Profil nie znaleziony."

3. **Błąd walidacji formularza (400 Bad Request) przy aktualizacji profilu:**
   - **Przyczyna:** Dane nie spełniają warunków walidacji.
   - **Działanie:** API zwraca `400` z listą błędów walidacji.
   - **Komunikat dla użytkownika:** Wyświetlenie komunikatów o błędach pod polami formularza.

4. **Błąd 401 przy aktualizacji profilu:**
   - **Przyczyna:** Sesja wygasła podczas edycji.
   - **Działanie:** Wyświetlenie toast z błędem.
   - **Komunikat dla użytkownika:** "Sesja wygasła. Zaloguj się ponownie."
   - **Akcja:** Przekierowanie do strony logowania.

5. **Błąd serwera (500) przy aktualizacji profilu:**
   - **Przyczyna:** Nieoczekiwany błąd serwera.
   - **Działanie:** Wyświetlenie toast z błędem.
   - **Komunikat dla użytkownika:** "Błąd serwera. Spróbuj ponownie później."

6. **Błąd 401 przy usuwaniu konta:**
   - **Przyczyna:** Sesja wygasła.
   - **Działanie:** Wyświetlenie toast z błędem.
   - **Komunikat dla użytkownika:** "Sesja wygasła. Zaloguj się ponownie."

7. **Błąd 500 przy usuwaniu konta:**
   - **Przyczyna:** Błąd podczas usuwania danych z bazy danych.
   - **Działanie:** Wyświetlenie toast z błędem. Dialog pozostaje otwarty lub się zamyka w zależności od logiki.
   - **Komunikat dla użytkownika:** "Nie udało się usunąć konta. Spróbuj ponownie później."

8. **Błędy sieciowe (timeout, brak internetu):**
   - **Działanie:** Wyświetlenie toast z komunikatem o błędzie sieciowym.
   - **Komunikat dla użytkownika:** "Błąd połączenia. Sprawdź swoją sieć internetową i spróbuj ponownie."

## 11. Kroki implementacji

1. **Aktualizacja middleware:** 
   - Zaktualizować `src/middleware/index.ts`, aby chronić ścieżkę `/profile/settings` (jeśli nie jest już chroniona).

2. **Definiowanie typów:** 
   - Dodać typy do `src/types.ts`:
     - `UserProfileDto`
     - `ProfileSettingsPageVM`
     - `EditProfileFormData`
     - `UpdateProfileRequest`
     - `UpdateProfileResponse`
     - `ValidationError`

3. **Utworzenie struktury katalogów:** 
   - Upewnić się, że katalog `src/pages/profile/` istnieje lub go utworzyć.

4. **Utworzenie strony Astro:** 
   - Stworzyć plik `src/pages/profile/settings.astro`.
   - Zaimplementować logikę pobierania danych z `/api/user/profile` po stronie serwera.
   - Zamieniać dane API na `ProfileSettingsPageVM` (w połączeniu z danymi z `Astro.locals.session`).
   - Renderować komponent `<ProfileSettingsView client:load />` z danymi.
   - Obsłużyć błędy (401, 404, 500).

5. **Implementacja API endpointów (backend):**
   - Jeśli endpoint `PUT /api/user/profile` nie istnieje, stwórz go w `src/pages/api/user/profile.ts`.
   - Implementacja walidacji, sanitacji i aktualizacji danych w bazie danych.
   - Zwracanie odpowiedniego statusu HTTP i typu odpowiedzi.
   - Zaplanuj test dla tego endpointu w `src/pages/api/user/profile.test.ts`.

6. **Utworzenie komponentu `ProfileSettingsView.tsx`:**
   - Stworzyć plik `src/components/ProfileSettingsView.tsx`.
   - Przyjmować `userProfile: ProfileSettingsPageVM` jako props.
   - Renderować komponenty potomne: `<EditProfileSection />` i `<DeleteAccountSection />`.

7. **Utworzenie komponentu `EditProfileSection.tsx`:**
   - Stworzyć plik `src/components/EditProfileSection.tsx`.
   - Zaimplementować:
     - Stan formularza (`formData`, `isLoading`, `error`, `successMessage`, `isDirty`).
     - Walidację po stronie klienta.
     - Obsługę zmiany pól.
     - Obsługę kliknięcia przycisku "Zapisz" (wysłanie `PUT /api/user/profile`).
     - Obsługę kliknięcia przycisku "Anuluj" (wycofanie zmian).
   - Renderować pola formularza przy użyciu komponentów Shadcn/ui.
   - Wyświetlać komunikaty o błędach i sukcesie.

8. **Utworzenie komponentu `DeleteAccountSection.tsx`:**
   - Stworzyć plik `src/components/DeleteAccountSection.tsx`.
   - Renderować sekcję z przyciskiem "Usuń konto".
   - Renderować komponent `<DeleteAccountDialog />`.

9. **Utworzenie komponentu `DeleteAccountDialog.tsx`:**
   - Stworzyć plik `src/components/DeleteAccountDialog.tsx`.
   - Zaimplementować:
     - Stan (`isOpen`, `isDeleting`, `error`).
     - Obsługę kliknięcia przycisku "Usuń konto" (otwarcie dialogu).
     - Obsługę kliknięcia "Anuluj" w dialogu (zamknięcie dialogu).
     - Obsługę kliknięcia "Usuń konto" w dialogu (wysłanie `DELETE /api/user`).
     - Przekierowanie i toast po pomyślnym usunięciu.
     - Obsługę błędów.
   - Renderować `AlertDialog` z komunikatami ostrzegawczymi.

10. **Integracja komponentów:**
    - Upewnić się, że komponenty React są ładowane po stronie klienta (`client:load` w Astro).
    - Obsłużyć style i dostępność (ARIA, semantyczne tagi HTML).

11. **Obsługa nawigacji:**
    - Zaimplementować przekierowanie do `/` po usunięciu konta.
    - Obsłużyć przekierowanie do `/login` jeśli sesja wygasła.

12. **Testowanie:**
    - Przetestować ręcznie cały przepływ edycji profilu:
      - Edycja nickname i kliknięcie "Zapisz".
      - Anulowanie zmian.
      - Walidacja formularza.
    - Przetestować ręcznie przepływ usuwania konta:
      - Kliknięcie "Usuń konto" i potwierdzenie w dialogu.
      - Anulowanie w dialogu.
      - Obsługa błędów.
    - Przetestować przypadki błędów (wygaśnięcie sesji, błędy serwera).
    - Przetestować dostępność (ARIA, nawigacja klawiatura).

13. **Przegląd kodu:**
    - Przegląd zgodności z wytycznymi dostępności (ARIA, semantyczne tagi HTML).
    - Przegląd pod kątem wydajności i optymalizacji.
    - Przegląd obsługi błędów i komunikatów dla użytkownika.


