# API Endpoint Implementation Plan: Feedback API

## 1. Przegląd punktu końcowego

Ten plan obejmuje implementację trzech operacji związanych z opiniami użytkowników: przesyłanie nowej opinii, pobieranie zagregowanych statystyk oraz pobieranie listy wszystkich opinii dla panelu administracyjnego.

- `POST /api/feedbacks`: Umożliwia zalogowanym użytkownikom przesłanie oceny i komentarza.
- `GET /api/feedbacks`: Zwraca paginowaną listę wszystkich opinii. Dostęp jest ograniczony tylko dla użytkowników z rolą administratora.
- `GET /api/feedbacks/stats`: Zwraca **publiczne** statystyki, takie jak średnia ocena i całkowita liczba opinii. Endpoint jest zawsze dostępny bez autoryzacji i służy do prezentacji na stronie głównej.

## 2. Szczegóły żądania

### `POST /api/feedbacks`

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/feedbacks`
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "This is a great app!"
  }
  ```
- **Walidacja (Zod)**:
  - `rating`: `integer`, wymagane, wartość od 1 do 5.
  - `comment`: `string`, opcjonalne, maksymalnie 1000 znaków.

### `GET /api/feedbacks/stats`

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/feedbacks/stats`
- **Parametry**: Brak.
- **Uwierzytelnianie**: Nie wymagane (publiczny endpoint).

### `GET /api/feedbacks`

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/feedbacks`
- **Uwierzytelnianie**: Wymagane (tylko administratorzy).
- **Parametry**:
  - **Opcjonalne (Query)**:
    - `page`: `integer` (numer strony, domyślnie 1)
    - `limit`: `integer` (liczba wyników na stronę, domyślnie 10, maksymalnie 100)

## 3. Wykorzystywane typy

Wszystkie wymagane typy DTO (`FeedbackRequest`, `FeedbackStatsDto`, `FeedbackDto`) są już zdefiniowane w `src/types.ts` i zostaną ponownie wykorzystane.

## 4. Szczegóły odpowiedzi

### `POST /api/feedbacks`

- **201 Created**:
  ```json
  {
    "message": "Dziękujemy za Twoją opinię."
  }
  ```

### `GET /api/feedbacks/stats`

- **200 OK**:
  ```json
  {
    "averageRating": 4.75,
    "totalFeedbacks": 1234
  }
  ```

### `GET /api/feedbacks`

- **200 OK**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Ta aplikacja jest fantastyczna!",
        "created_at": "2025-11-10T10:00:00Z",
        "user_id": "user-uuid-1"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1
  }
  ```
- **403 Forbidden** (jeśli użytkownik nie jest administratorem):
  ```json
  {
    "error": "Forbidden",
    "message": "You do not have permission to access this resource"
  }
  ```

## 5. Przepływ danych

1.  **Middleware**: Middleware Astro (`src/middleware/index.ts`) przechwytuje wszystkie żądania do `/api/*`. Weryfikuje token JWT i dołącza sesję użytkownika do `context.locals`.
2.  **Routing**: Astro kieruje żądanie do odpowiedniego pliku w `src/pages/api/`.
3.  **Endpoint Handler**:
    - Waliduje dane wejściowe (ciało żądania lub parametry zapytania) za pomocą Zod.
    - Wywołuje odpowiednią metodę w `FeedbackService`.
    - Dla `GET /api/admin/feedbacks`, sprawdza uprawnienia administratora przed wywołaniem serwisu.
4.  **FeedbackService (`src/lib/services/feedback.service.ts`)**:
    - Zawiera logikę biznesową.
    - Komunikuje się z bazą danych Supabase w celu wykonania operacji CRUD.
    - Dla `getFeedbackStats`, może wywołać dedykowaną funkcję PostgreSQL (RPC) w celu optymalizacji wydajności.
5.  **Odpowiedź**: Handler API formatuje dane zwrócone przez serwis i wysyła odpowiedź HTTP z odpowiednim kodem statusu.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**:
  - `GET /api/feedbacks/stats` jest **publiczny** i nie wymaga uwierzytelniania - służy do prezentacji na stronie głównej
  - `POST /api/feedbacks` i `GET /api/feedbacks` wymagają uwierzytelnienia przez middleware weryfikujący token JWT Supabase
- **Autoryzacja**:
  - `POST /api/feedbacks`: `user_id` jest pobierany z `context.locals.user.id`, aby zapewnić, że użytkownicy mogą przesyłać opinie tylko w swoim imieniu.
  - `GET /api/feedbacks`: Ten punkt końcowy implementuje sprawdzenie roli administratora. W przypadku braku uprawnień, API zwróci `403 Forbidden`.
- **Walidacja danych**: Rygorystyczna walidacja za pomocą Zod na poziomie API zapobiega atakom typu injection i zapewnia integralność danych.
- **Polityki RLS**: Chociaż serwis będzie zarządzał logiką, polityki Row Level Security w Supabase powinny być skonfigurowane jako dodatkowa warstwa obrony, aby zapewnić, że operacje na danych są zgodne z uprawnieniami.

## 7. Rozważania dotyczące wydajności

- **`GET /api/feedbacks/stats`**: Obliczenia statystyk (średnia, liczba) mogą być kosztowne przy dużej ilości danych. Należy zaimplementować je za pomocą zoptymalizowanego zapytania SQL, najlepiej jako funkcja RPC w Supabase, aby zminimalizować transfer danych i obciążenie serwera aplikacji. Endpoint jest publiczny, więc należy rozważyć cache'owanie wyników.
- **`GET /api/feedbacks`**: Paginacja jest kluczowa, aby uniknąć pobierania dużej liczby rekordów naraz. Należy również zastosować odpowiednie indeksy na kolumnach `created_at` w tabeli `feedback`, aby przyspieszyć sortowanie.

## 8. Etapy wdrożenia

1.  **Aktualizacja schematu bazy danych**: Upewnić się, że tabela `feedback` w `supabase/migrations` jest zgodna ze specyfikacją.
2.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/feedback.service.ts` i zaimplementować w nim logikę biznesową:
    - `createFeedback(userId, data)`
    - `getFeedbackStats()`
    - `getAllFeedback({ page, limit })`
3.  **Implementacja `POST /api/feedbacks`**:
    - Utworzyć plik `src/pages/api/feedbacks/index.ts`.
    - Zaimplementować handler `POST` z walidacją Zod i wywołaniem `feedbackService.createFeedback`.
4.  **Implementacja `GET /api/feedbacks/stats`**:
    - Utworzyć plik `src/pages/api/feedbacks/stats.ts`.
    - Zaimplementować **publiczny** handler `GET` wywołujący `feedbackService.getFeedbackStats`.
5.  **Implementacja `GET /api/feedbacks`**:
    - Dodać do pliku `src/pages/api/feedbacks/index.ts` handler `GET`.
    - Zaimplementować walidację parametrów paginacji.
    - Dodać logikę sprawdzania roli administratora.
    - Wywołać `feedbackService.getAllFeedback`.
6.  **Testy jednostkowe**: Napisać testy jednostkowe dla `FeedbackService` w pliku `src/lib/services/feedback.service.test.ts`, mockując klienta Supabase.
7.  **Testy integracyjne**: Napisać testy integracyjne dla każdego punktu końcowego w plikach `*.test.ts` obok plików API, aby zweryfikować cały przepływ, w tym walidację, autoryzację i poprawność odpowiedzi.
8.  **Dokumentacja**: Zaktualizować dokumentację API, jeśli zaszły jakiekolwiek zmiany w stosunku do tego planu.
