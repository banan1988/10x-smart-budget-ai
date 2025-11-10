# Plan Implementacji Punktu Końcowego: User Management

## 1. Cel
Celem jest stworzenie dwóch kluczowych punktów końcowych API do zarządzania danymi użytkownika:
- `GET /api/user/profile`: Umożliwia pobranie danych profilowych zalogowanego użytkownika, takich jak pseudonim i preferencje (motyw, język).
- `DELETE /api/user`: Zapewnia mechanizm do trwałego usunięcia konta użytkownika i wszystkich powiązanych z nim danych (profil, transakcje). Jest to backendowa implementacja dla funkcji "Usuń konto", która będzie dostępna dla użytkownika w interfejsie aplikacji.

## 2. Wymagania Funkcjonalne

### GET /api/user/profile
- **Metoda HTTP**: `GET`
- **URL**: `/api/user/profile`
- **Odpowiedź (200 OK)**: Zwraca obiekt JSON z danymi profilu użytkownika.
  ```json
  {
    "nickname": "BudżetowyMistrz",
    "preferences": {
      "theme": "dark",
      "language": "pl"
    }
  }
  ```
- **Odpowiedzi błędów**:
    - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
    - `404 Not Found`: Jeśli profil użytkownika nie istnieje w bazie danych.

### DELETE /api/user
- **Metoda HTTP**: `DELETE`
- **URL**: `/api/user`
- **Odpowiedź (204 No Content)**: Zwracana po pomyślnym usunięciu konta.
- **Odpowiedzi błędów**:
    - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
    - `500 Internal Server Error`: Jeśli wystąpi krytyczny błąd podczas usuwania danych.

## 3. Struktura Danych (DTO)
- **`UserProfileDto`** (z `src/types.ts`): Będzie używany jako typ odpowiedzi dla `GET /api/user/profile`.
  ```typescript
  export type UserProfileDto = Pick<Tables<'user_profiles'>, 'nickname' | 'preferences'>;
  ```
  *Uwaga: Typ `preferences` w bazie danych to `JSONB`, co pozwala na elastyczne dodawanie nowych pól, takich jak `language`, bez zmiany schematu.*

## 4. Logika Biznesowa
Logika biznesowa zostanie wyodrębniona do dedykowanego serwisu `UserService` (`src/lib/services/user.service.ts`), który będzie odpowiedzialny za interakcje z bazą danych.

- **`getUserProfile(userId, supabase)`**: Metoda pobierze profil użytkownika na podstawie `userId`. W przypadku braku profilu zwróci `null`.
- **`deleteUser(userId)`**: Metoda usunie użytkownika z systemu. Ze względu na wymagane uprawnienia administracyjne, utworzy tymczasowego klienta Supabase z kluczem `service_role`. Usunięcie użytkownika z `auth.users` wywoła kaskadowe usunięcie powiązanych danych (`user_profiles`, `transactions`) dzięki relacjom `ON DELETE CASCADE` w bazie danych.

## 5. Implementacja Punktu Końcowego (API Route)
Zostaną utworzone dwa pliki w katalogu `src/pages/api/user/`:

- **`profile.ts` (dla `GET /api/user/profile`)**:
  1. Handler `GET` odbierze `context` z middleware.
  2. Sprawdzi, czy użytkownik jest zalogowany (`context.locals.user`). Jeśli nie, zwróci `401`.
  3. Wywoła `userService.getUserProfile`, przekazując ID użytkownika i klienta `supabase` z `context.locals`.
  4. Jeśli serwis zwróci profil, handler odpowie `200 OK` z danymi. W przeciwnym razie `404 Not Found`.

- **`index.ts` (dla `DELETE /api/user`)**:
  1. Handler `DELETE` odbierze `context`.
  2. Sprawdzi, czy użytkownik jest zalogowany. Jeśli nie, zwróci `401`.
  3. Wywoła `userService.deleteUser`, przekazując ID użytkownika.
  4. Jeśli operacja się powiedzie, zwróci `204 No Content`. W przypadku błędu w serwisie, zwróci `500 Internal Server Error`.

## 6. Bezpieczeństwo
- **Uwierzytelnianie**: Dostęp do obu endpointów będzie chroniony. Middleware Astro zweryfikuje token JWT (Supabase) w nagłówku `Authorization`.
- **Autoryzacja**: Logika w handlerach będzie operować wyłącznie na ID użytkownika pobranym z zaufanego obiektu `context.locals.user`, co zapobiega próbom dostępu do danych innych użytkowników.
- **Klucze administracyjne**: Klucz `SUPABASE_SERVICE_ROLE_KEY` będzie używany wyłącznie po stronie serwera w metodzie `deleteUser` i przechowywany bezpiecznie jako zmienna środowiskowa. Nie będzie on nigdy eksponowany po stronie klienta.

## 7. Plan Działania
1.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/user.service.ts` i zaimplementować w nim klasę `UserService` z metodami `getUserProfile` i `deleteUser`.
2.  **Testy jednostkowe serwisu**: Stworzyć plik `src/lib/services/user.service.test.ts` i napisać testy dla obu metod, mockując klienta Supabase.
3.  **Implementacja endpointu GET**: Stworzyć plik `src/pages/api/user/profile.ts` i zaimplementować handler `GET` zgodnie z planem.
4.  **Implementacja endpointu DELETE**: Stworzyć plik `src/pages/api/user/index.ts` i zaimplementować handler `DELETE` zgodnie z planem.
5.  **Testy integracyjne**: Dodać testy integracyjne dla obu endpointów, aby zweryfikować cały przepływ, włączając w to middleware i interakcję z bazą danych (z użyciem mocków).
6.  **Weryfikacja manualna**: Uruchomić aplikację i przetestować działanie obu endpointów za pomocą narzędzia API (np. cURL, Postman), sprawdzając kody odpowiedzi i zmiany w bazie danych.

