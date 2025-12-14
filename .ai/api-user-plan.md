# API Endpoint Implementation Plan: User Management

## 1. Przegląd punktu końcowego

Ten plan obejmuje dwa punkty końcowe do zarządzania danymi użytkownika:

- `GET /api/user/profile`: Służy do pobierania danych profilowych zalogowanego użytkownika, takich jak pseudonim i preferencje.
- `DELETE /api/user`: Zapewnia mechanizm do trwałego usunięcia konta użytkownika i wszystkich powiązanych z nim danych.

## 2. Szczegóły żądania

### GET /api/user/profile

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/user/profile`
- **Parametry**:
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body**: Brak

### DELETE /api/user

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/user`
- **Parametry**:
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **`UserProfileDto`** (z `src/types.ts`): Używany jako typ odpowiedzi dla `GET /api/user/profile`.
  ```typescript
  export type UserProfileDto = Pick<Tables<"user_profiles">, "nickname" | "preferences">;
  ```

## 4. Szczegóły odpowiedzi

### GET /api/user/profile

- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON z danymi profilu.
  ```json
  {
    "nickname": "Użytkownik123",
    "preferences": { "theme": "dark", "language": "pl" }
  }
  ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Profil użytkownika nie istnieje.

### DELETE /api/user

- **Odpowiedź sukcesu (204 No Content)**: Zwracana po pomyślnym usunięciu konta.
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wystąpił błąd podczas usuwania danych.

## 5. Przepływ danych

### GET /api/user/profile

1.  Klient wysyła żądanie `GET` na `/api/user/profile`.
2.  Middleware weryfikuje sesję użytkownika.
3.  Handler wywołuje `userService.getUserProfile`, przekazując ID użytkownika.
4.  Serwis pobiera dane z tabeli `user_profiles`.
5.  Handler zwraca dane profilu jako JSON lub błąd 404.

### DELETE /api/user

1.  Klient wysyła żądanie `DELETE` na `/api/user`.
2.  Middleware weryfikuje sesję użytkownika.
3.  Handler wywołuje `userService.deleteUser`, przekazując ID użytkownika.
4.  Serwis, używając klienta z uprawnieniami `service_role`, usuwa użytkownika z `auth.users`.
5.  Baza danych kaskadowo usuwa powiązane dane (`user_profiles`, `transactions`).
6.  Handler zwraca status `204 No Content` lub błąd 500.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do obu endpointów jest chroniony przez middleware weryfikujące token JWT.
- **Autoryzacja**: Operacje są wykonywane wyłącznie w kontekście zalogowanego użytkownika (na podstawie `context.locals.user.id`), co zapobiega nieautoryzowanym działaniom na kontach innych użytkowników.
- **Klucze administracyjne**: Klucz `SUPABASE_SERVICE_ROLE_KEY` jest używany bezpiecznie po stronie serwera i nigdy nie jest eksponowany na zewnątrz.

## 7. Obsługa błędów

- **Brak uwierzytelnienia**: Middleware zwraca `401 Unauthorized`.
- **Brak profilu**: `GET /api/user/profile` zwróci `404 Not Found`.
- **Błędy serwera**: Wszelkie błędy operacji na bazie danych zostaną przechwycone, zalogowane, a do klienta zostanie wysłana odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- **Operacja usuwania**: Usuwanie użytkownika jest operacją destrukcyjną i może być czasochłonne, jeśli użytkownik ma dużą liczbę transakcji. Proces ten jest jednak wykonywany asynchronicznie i rzadko, więc nie powinien wpływać na ogólną wydajność aplikacji.
- **Pobieranie profilu**: Zapytanie o profil użytkownika jest szybkie i zindeksowane. Nie przewiduje się problemów z wydajnością.

## 9. Etapy wdrożenia

1.  **Implementacja serwisu**: Stworzyć `src/lib/services/user.service.ts` z metodami `getUserProfile` i `deleteUser`.
2.  **Testy jednostkowe serwisu**: Napisać testy dla `UserService`, mockując klienta Supabase.
3.  **Implementacja endpointu GET**: Stworzyć `src/pages/api/user/profile.ts`.
4.  **Implementacja endpointu DELETE**: Stworzyć `src/pages/api/user/index.ts`.
5.  **Testy integracyjne**: Dodać testy dla obu endpointów, weryfikując przepływ i interakcje.
6.  **Weryfikacja manualna**: Przetestować działanie obu endpointów za pomocą narzędzi API.
