# API Endpoint Implementation Plan: /api/transactions

## 1. Przegląd punktu końcowego
Ten punkt końcowy zarządza transakcjami finansowymi użytkownika (przychodami i wydatkami). Umożliwia tworzenie, odczytywanie, aktualizowanie i usuwanie transakcji (CRUD). W przypadku tworzenia wydatku, punkt końcowy automatycznie kategoryzuje go za pomocą usługi AI. Wszystkie operacje wymagają uwierzytelnienia użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`, `POST`, `PUT`, `DELETE`
- **Struktura URL**:
    - `/api/transactions` (dla `GET` i `POST`)
    - `/api/transactions/[id]` (dla `PUT` i `DELETE`)
- **Parametry**:
    - **`GET /api/transactions`**:
        - Wymagane: `month` (query param, format `YYYY-MM`)
    - **`POST /api/transactions`**:
        - Request Body: `CreateTransactionCommand`
    - **`PUT /api/transactions/[id]`**:
        - Wymagane: `id` (URL param, integer)
        - Request Body: `UpdateTransactionCommand` (co najmniej jedno pole)
    - **`DELETE /api/transactions/[id]`**:
        - Wymagane: `id` (URL param, integer)
- **Request Body**:
    - **`POST`**: `{ "type": "income" | "expense", "amount": number, "description": string, "date": "YYYY-MM-DD" }`
    - **`PUT`**: `{ "type"?: "income" | "expense", "amount"?: number, "description"?: string, "date"?: "YYYY-MM-DD", "categoryId"?: number | null }`

## 3. Wykorzystywane typy
- **`GetTransactionsQuery` (Zod Schema)**: Do walidacji parametrów zapytania `GET`.
  ```typescript
  { month: z.string().regex(/^\d{4}-\d{2}$/) }
  ```
- **`CreateTransactionCommand` (Zod Schema)**: Do walidacji ciała żądania `POST`.
  ```typescript
  {
    type: z.enum(['income', 'expense']),
    amount: z.number().int().positive(),
    description: z.string().min(1).max(255),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }
  ```
- **`UpdateTransactionCommand` (Zod Schema)**: Do walidacji ciała żądania `PUT`.
  ```typescript
  {
    type: z.enum(['income', 'expense']).optional(),
    amount: z.number().int().positive().optional(),
    description: z.string().min(1).max(255).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    categoryId: z.number().int().nullable().optional()
  }
  ```
- **`TransactionDto` (TypeScript Type)**: Obiekt transferu danych dla odpowiedzi.
  ```typescript
  interface TransactionDto {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string;
    category: {
      id: number;
      key: string;
      name: string;
    } | null;
    is_ai_categorized: boolean;
  }
  ```

## 4. Szczegóły odpowiedzi
- **`GET /api/transactions`**:
    - `200 OK`: Zwraca tablicę `TransactionDto[]`.
- **`POST /api/transactions`**:
    - `201 Created`: Zwraca nowo utworzony `TransactionDto`.
- **`PUT /api/transactions/[id]`**:
    - `200 OK`: Zwraca zaktualizowany `TransactionDto`.
- **`DELETE /api/transactions/[id]`**:
    - `204 No Content`: Brak zawartości w odpowiedzi.
- **Błędy (dla wszystkich metod)**:
    - `400 Bad Request`: Błąd walidacji danych wejściowych.
    - `401 Unauthorized`: Użytkownik nie jest zalogowany.
    - `404 Not Found`: Transakcja o podanym ID nie istnieje lub nie należy do użytkownika.
    - `500 Internal Server Error`: Błąd serwera (np. błąd bazy danych, błąd usługi AI).

## 5. Przepływ danych
1.  Żądanie przychodzi do odpowiedniego handlera w `src/pages/api/transactions.ts` lub `src/pages/api/transactions/[id].ts`.
2.  Middleware Astro weryfikuje sesję użytkownika i udostępnia klienta Supabase w `context.locals`.
3.  Handler sprawdza istnienie sesji użytkownika. Jeśli jej brak, zwraca `401`.
4.  Dane wejściowe (query, body, params) są walidowane przy użyciu odpowiedniej schemy Zod. W przypadku błędu walidacji zwracany jest `400`.
5.  Handler wywołuje odpowiednią metodę w `TransactionService`, przekazując zweryfikowane dane oraz ID użytkownika.
6.  `TransactionService` wykonuje logikę biznesową:
    - W przypadku `POST` typu 'expense', wywołuje `CategoryService` (lub podobną usługę AI) w celu uzyskania ID kategorii na podstawie opisu.
    - Wykonuje operacje na bazie danych Supabase, zawsze filtrując zapytania po `user_id`, aby zapewnić autoryzację.
    - Mapuje wyniki z bazy danych na `TransactionDto`, dołączając dane kategorii.
7.  Handler API otrzymuje dane z serwisu i zwraca odpowiedź HTTP z odpowiednim kodem statusu i ciałem.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Sesja użytkownika będzie sprawdzana za pomocą `context.locals.user`. Brak sesji spowoduje zwrócenie błędu `401`.
- **Autoryzacja**: Wszystkie operacje na bazie danych muszą być ograniczone do danych zalogowanego użytkownika. Każde zapytanie SQL (`SELECT`, `UPDATE`, `DELETE`) musi zawierać klauzulę `WHERE user_id = :userId`. Przed aktualizacją lub usunięciem transakcji należy zweryfikować, czy zasób należy do użytkownika, aby zapobiec nieautoryzowanym modyfikacjom.
- **Walidacja danych wejściowych**: Rygorystyczna walidacja za pomocą Zod na poziomie API zapobiegnie atakom typu SQL Injection i zapewni integralność danych.

## 7. Obsługa błędów
- **Błędy walidacji (400)**: Zod zwróci szczegółowe błędy, które zostaną zalogowane po stronie serwera, a klient otrzyma ogólną odpowiedź `400 Bad Request`.
- **Brak autoryzacji (401)**: Zwracany, gdy `context.locals.user` jest `null`.
- **Nie znaleziono zasobu (404)**: Zwracany, gdy zapytanie do bazy danych o konkretne `id` transakcji (z filtrowaniem `user_id`) nie zwróci wyników.
- **Błędy serwera (500)**: Wszelkie nieoczekiwane błędy (np. błąd połączenia z bazą danych, niepowodzenie kategoryzacji AI) będą przechwytywane w bloku `try...catch`. Błąd zostanie zalogowany na serwerze, a klient otrzyma ogólną odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności
- **Zapytania do bazy danych**: Zapytanie `GET` powinno być zoptymalizowane. Należy pobierać transakcje i powiązane kategorie w jednym zapytaniu (np. używając `JOIN`), aby uniknąć problemu N+1.
- **Paginacja**: Obecna specyfikacja nie wymaga paginacji, ale w przyszłości może być ona konieczna, jeśli użytkownik będzie miał dużą liczbę transakcji w miesiącu.
- **Indeksy**: Należy upewnić się, że kolumny `user_id` i `date` w tabeli `transactions` są zindeksowane, aby przyspieszyć filtrowanie.

## 9. Etapy wdrożenia
1.  **Definicja typów i schematów Zod**: Zdefiniować typy `TransactionDto` oraz schemy Zod (`GetTransactionsQuery`, `CreateTransactionCommand`, `UpdateTransactionCommand`) w `src/types.ts` lub dedykowanym pliku walidacji.
2.  **Utworzenie TransactionService**: Stworzyć plik `src/lib/services/transaction.service.ts` z klasą `TransactionService`.
3.  **Implementacja metod serwisu**:
    - `getTransactions(userId: string, month: string)`
    - `createTransaction(userId: string, command: CreateTransactionCommand)`
    - `updateTransaction(userId: string, transactionId: number, command: UpdateTransactionCommand)`
    - `deleteTransaction(userId: string, transactionId: number)`
4.  **Integracja z AI**: W metodzie `createTransaction` dodać logikę warunkowego wywołania serwisu kategoryzacji AI dla transakcji typu 'expense'.
5.  **Utworzenie plików API**: Stworzyć pliki `src/pages/api/transactions.ts` i `src/pages/api/transactions/[id].ts`.
6.  **Implementacja handlerów API**:
    - W `transactions.ts` zaimplementować handlery `GET` i `POST`.
    - W `transactions/[id].ts` zaimplementować handlery `PUT` i `DELETE`.
7.  **Podłączenie logiki**: W handlerach API dodać walidacj�� Zod, sprawdzanie uwierzytelnienia i wywołania odpowiednich metod z `TransactionService`.
8.  **Testy jednostkowe**: Napisać testy jednostkowe dla `TransactionService`, mockując zależność od bazy danych (Supabase) i serwisu AI.
9.  **Testy integracyjne**: Napisać testy integracyjne dla każdego punktu końcowego API (`GET`, `POST`, `PUT`, `DELETE`), aby zweryfikować cały przepływ, od żądania HTTP po odpowiedź.

