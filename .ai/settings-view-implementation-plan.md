# Plan implementacji widoku Ustawień

## 1. Przegląd
Widok Ustawień (`/settings`) umożliwia zalogowanym użytkownikom zarządzanie swoim kontem. W pierwszej wersji widok ten będzie zawierał podstawowe informacje o profilu użytkownika oraz opcję trwałego usunięcia konta wraz ze wszystkimi powiązanymi danymi. Proces usuwania konta jest zabezpieczony dodatkowym krokiem potwierdzenia, aby zapobiec przypadkowym działaniom.

## 2. Routing widoku
- **Ścieżka:** `/settings`
- **Dostęp:** Widok będzie dostępny tylko dla zalogowanych użytkowników. Dostęp do ścieżki będzie chroniony przez middleware weryfikujący sesję użytkownika.

## 3. Struktura komponentów
Widok zostanie zaimplementowany jako strona Astro (`SettingsPage.astro`), która będzie renderować komponenty React do obsługi interaktywnych elementów.

```
SettingsPage.astro
└── UserProfile.tsx
    └── DeleteAccountDialog.tsx
        ├── AlertDialog (Shadcn/ui)
        └── Button (Shadcn/ui)
```

## 4. Szczegóły komponentów

### `SettingsPage.astro`
- **Opis:** Główny plik strony, który definiuje layout i integruje komponenty klienckie. Pobiera dane profilu użytkownika po stronie serwera i przekazuje je do komponentu `UserProfile`.
- **Główne elementy:**
    - `Layout.astro` jako główny szablon strony.
    - Komponent `<UserProfile client:load />` do renderowania interfejsu.
- **Propsy:** Brak.

### `UserProfile.tsx`
- **Opis:** Komponent React odpowiedzialny za wyświetlanie informacji o profilu użytkownika oraz inicjowanie akcji usunięcia konta.
- **Główne elementy:**
    - Elementy HTML do wyświetlenia nazwy użytkownika (`nickname`).
    - Komponent `<DeleteAccountDialog />`.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji; deleguje akcję usunięcia do komponentu potomnego.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserProfileVM`.
- **Propsy:**
    - `userProfile: UserProfileVM` - obiekt z danymi profilu użytkownika.

### `DeleteAccountDialog.tsx`
- **Opis:** Komponent React, który zarządza procesem usuwania konta. Zawiera przycisk inicjujący akcję oraz modal `AlertDialog` do ostatecznego potwierdzenia.
- **Główne elementy:**
    - `<Button variant="destructive">` (Shadcn/ui) do otwarcia dialogu.
    - `<AlertDialog>` (Shadcn/ui) z tytułem, opisem ostrzegawczym i przyciskami akcji ("Anuluj", "Usuń konto").
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku "Usuń konto" otwiera `AlertDialog`.
    - Kliknięcie przycisku "Anuluj" w dialogu zamyka go.
    - Kliknięcie przycisku "Usuń konto" w dialogu uruchamia wywołanie API `DELETE /api/user`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

### `UserProfileVM` (ViewModel)
ViewModel używany do przekazywania danych z serwera (Astro) do klienta (React).
```typescript
interface UserProfileVM {
  nickname: string | null;
}
```
- **`nickname`**: Nazwa użytkownika do wyświetlenia. Może być `null`, jeśli nie została ustawiona.

## 6. Zarządzanie stanem
- **`SettingsPage.astro`**: Brak stanu po stronie serwera. Dane są pobierane i przekazywane jednorazowo.
- **`DeleteAccountDialog.tsx`**:
    - `isOpen`: `boolean` - zarządza widocznością `AlertDialog`.
    - `isDeleting`: `boolean` - wskazuje, czy trwa proces usuwania konta (do blokowania przycisku i wyświetlania wskaźnika ładowania).
    - Nie ma potrzeby tworzenia dedykowanego hooka; `useState` jest wystarczający.

## 7. Integracja API

### `GET /api/user/profile`
- **Cel:** Pobranie danych profilu użytkownika.
- **Miejsce wywołania:** Po stronie serwera w `SettingsPage.astro`.
- **Typ odpowiedzi (sukces):** `UserProfileDto`
  ```typescript
  interface UserProfileDto {
    nickname: string | null;
    preferences: { [key: string]: any } | null;
  }
  ```
- **Akcja po stronie UI:** Dane z odpowiedzi są mapowane na `UserProfileVM` i przekazywane jako props do komponentu `UserProfile`.

### `DELETE /api/user`
- **Cel:** Usunięcie konta zalogowanego użytkownika.
- **Miejsce wywołania:** W komponencie `DeleteAccountDialog.tsx` po potwierdzeniu akcji przez użytkownika.
- **Typ odpowiedzi (sukces):** `204 No Content`.
- **Akcja po stronie UI:** Po pomyślnym usunięciu konta, użytkownik jest przekierowywany na stronę główną (`/`) z komunikatem informującym o wylogowaniu i usunięciu konta.

## 8. Interakcje użytkownika
1.  **Użytkownik wchodzi na `/settings`**: Widzi swój `nickname` oraz przycisk "Usuń konto".
2.  **Użytkownik klika "Usuń konto"**: Otwiera się modal `AlertDialog`.
3.  **Użytkownik klika "Anuluj" w dialogu**: Modal zostaje zamknięty, stan aplikacji pozostaje bez zmian.
4.  **Użytkownik klika "Usuń konto" w dialogu**:
    - Przycisk "Usuń konto" w dialogu staje się nieaktywny, pojawia się wskaźnik ładowania.
    - Wysyłane jest żądanie `DELETE /api/user`.
    - Po otrzymaniu odpowiedzi `204`, użytkownik jest przekierowywany na stronę główną. Wyświetlany jest toast z informacją o pomyślnym usunięciu konta.

## 9. Warunki i walidacja
- **Dostęp do widoku:** Middleware Astro (`src/middleware/index.ts`) musi weryfikować, czy `Astro.locals.session` istnieje. Jeśli nie, użytkownik jest przekierowywany na stronę logowania.
- **Wyświetlanie profilu:** Komponent `UserProfile` powinien obsłużyć przypadek, gdy `nickname` ma wartość `null` (np. wyświetlając domyślny tekst).

## 10. Obsługa błędów
- **Błąd pobierania profilu (`GET /api/user/profile`)**: Jeśli `SettingsPage.astro` nie otrzyma danych (np. z powodu błędu 401 lub 404), strona powinna zwrócić odpowiedni kod statusu HTTP i ewentualnie wyświetlić stronę błędu.
- **Błąd usuwania konta (`DELETE /api/user`)**:
    - **`401 Unauthorized`**: Sesja użytkownika wygasła. Należy wyświetlić toast z błędem i przekierować na stronę logowania.
    - **`500 Internal Server Error`**: Wystąpił błąd serwera. Należy wyświetlić toast z informacją o niepowodzeniu operacji i zamknąć `AlertDialog`, odblokowując przycisk.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro:** Stworzyć plik `src/pages/settings.astro`.
2.  **Ochrona ścieżki:** Zaktualizować middleware w `src/middleware/index.ts`, aby chronił ścieżkę `/settings`.
3.  **Pobieranie danych w Astro:** W `settings.astro` zaimplementować logikę pobierania danych z `/api/user/profile` po stronie serwera.
4.  **Utworzenie ViewModel:** Zdefiniować typ `UserProfileVM` w `src/types.ts` lub bezpośrednio w komponencie, jeśli nie będzie reużywany.
5.  **Utworzenie komponentu `UserProfile.tsx`:** Stworzyć plik `src/components/UserProfile.tsx`, który przyjmie dane profilu jako props i wyświetli je.
6.  **Utworzenie komponentu `DeleteAccountDialog.tsx`:** Stworzyć plik `src/components/DeleteAccountDialog.tsx`, który będzie zawierał przycisk i `AlertDialog` z biblioteki Shadcn/ui.
7.  **Implementacja logiki usuwania:** W `DeleteAccountDialog.tsx` zaimplementować logikę stanu (`isOpen`, `isDeleting`) oraz obsługę wywołania API `DELETE /api/user`.
8.  **Integracja komponentów:** Zintegrować `UserProfile` i `DeleteAccountDialog` w `settings.astro`, upewniając się, że komponenty React są ładowane po stronie klienta (`client:load`).
9.  **Obsługa nawigacji i powiadomień:** Zaimplementować przekierowanie po usunięciu konta oraz wyświetlanie powiadomień (toastów) o sukcesie lub błędzie operacji.
10. **Testowanie:** Przetestować ręcznie cały przepływ, włączając w to przypadki błędów (np. wygaśnięcie sesji).

