# API Endpoint Implementation Plan: GET /api/dashboard

## 1. Przegląd punktu końcowego
Ten punkt końcowy pobiera zagregowane dane finansowe dla widoku pulpitu nawigacyjnego dla określonego miesiąca. Zwraca sumę dochodów, wydatków, saldo, dane do wykresu wydatków według kategorii oraz podsumowanie wygenerowane przez AI. Dostęp jest ograniczony do uwierzytelnionych użytkowników.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/dashboard`
- **Parametry**:
    - **Wymagane**:
        - `month` (string): Miesiąc do pobrania danych w formacie `YYYY-MM`.
- **Request Body**: Brak

## 3. Wykorzystywane typy
- **DashboardDataDTO**:
  ```typescript
  interface DashboardDataDTO {
    income: number;
    expenses: number;
    balance: number;
    spendingChart: SpendingChartData;
    aiSummary: string;
  }
  ```
- **SpendingChartData**:
  ```typescript
  interface SpendingChartData {
    categories: SpendingByCategory[];
  }
  ```
- **SpendingByCategory**:
  ```typescript
  interface SpendingByCategory {
    id: number;
    name: string;
    total: number;
  }
  ```
- **Input Schema (Zod)**:
  ```typescript
  import { z } from 'zod';

  export const GetDashboardSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  });
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "income": number,
    "expenses": number,
    "balance": number,
    "spendingChart": {
      "categories": [
        { "id": number, "name": "string", "total": number }
      ]
    },
    "aiSummary": "string"
  }
  ```
- **Odpowiedzi błędów**:
    - `400 Bad Request`: Jeśli parametr `month` jest brakujący lub w nieprawidłowym formacie.
    - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
    - `500 Internal Server Error`: W przypadku błędów serwera, np. problemów z połączeniem z bazą danych.

## 5. Przepływ danych
1.  Punkt końcowy `GET /api/dashboard` w Astro (`src/pages/api/dashboard.ts`) odbiera żądanie.
2.  Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika (JWT) przy użyciu Supabase. Jeśli użytkownik nie jest uwierzytelniony, zwraca błąd 401.
3.  Handler API waliduje parametr zapytania `month` przy użyciu schematu Zod (`GetDashboardSchema`). W przypadku niepowodzenia walidacji zwraca błąd 400.
4.  Handler wywołuje nową metodę w serwisie `DashboardService` (np. `getDashboardData(userId, month)`), przekazując ID użytkownika i miesiąc.
5.  `DashboardService` wykonuje następujące operacje, pobierając dane z bazy danych Supabase dla danego użytkownika i miesiąca:
    - Oblicza sumę dochodów (`income`).
    - Oblicza sumę wydatków (`expenses`).
    - Oblicza saldo (`balance = income - expenses`).
    - Agreguje wydatki według kategorii, aby utworzyć dane dla `spendingChart`. Nazwy kategorii są pobierane z pola `translations` w tabeli `categories` na podstawie języka użytkownika.
6.  `DashboardService` wysyła zapytanie do zewnętrznego API AI (np. OpenAI) z prośbą o wygenerowanie podsumowania (`aiSummary`) na podstawie zagregowanych danych.
7.  Serwis zwraca obiekt `DashboardDataDTO` do handlera API.
8.  Handler API serializuje obiekt DTO do formatu JSON i wysyła go jako odpowiedź z kodem statusu 200.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być chroniony. Middleware Astro zweryfikuje token JWT użytkownika z Supabase przy każdym żądaniu.
- **Autoryzacja**: Użytkownicy mogą pobierać tylko własne dane finansowe. Wszystkie zapytania do bazy danych muszą być filtrowane według `user_id` pobranego z sesji.
- **Walidacja danych wejściowych**: Parametr `month` musi być rygorystycznie walidowany przy użyciu Zod, aby zapobiec atakom, takim jak SQL Injection (chociaż Supabase client parametryzuje zapytania) i zapewnić poprawność formatu.
- **Zarządzanie kluczami API**: Klucz API do usługi AI musi być bezpiecznie przechowywany jako zmienna środowiskowa (`OPENAI_API_KEY`) i nigdy nie być eksponowany po stronie klienta. Dostęp do niego powinien odbywać się wyłącznie po stronie serwera.

## 7. Rozważania dotyczące wydajności
- **Zapytania do bazy danych**: Należy zoptymalizować zapytania SQL, aby efektywnie agregować dane. Użycie pojedynczego, dobrze skonstruowanego zapytania lub funkcji bazodanowej (RPC w Supabase) może być bardziej wydajne niż wielokrotne zapytania.
- **Indeksowanie**: Kolumny `user_id` i `transaction_date` w tabeli transakcji powinny być zindeksowane, aby przyspieszyć filtrowanie danych.
- **Czas odpowiedzi API AI**: Zewnętrzne wywołanie API AI może wprowadzić opóźnienie. Należy zaimplementować odpowiedni timeout i mechanizm ponawiania prób. Zaimplementować buforowanie odpowiedzi AI dla tego samego zestawu danych.
- **Buforowanie (Caching)**: Można rozważyć wprowadzenie mechanizmu buforowania po stronie serwera (np. w pamięci lub Redis) dla danych pulpitu, które nie zmieniają się często w ciągu dnia, aby zmniejszyć obciążenie bazy danych.

## 8. Etapy wdrożenia
1.  **Aktualizacja typów**: Zdefiniuj typy `DashboardDataDTO`, `SpendingChartData` i `SpendingByCategory` w pliku `src/types.ts`.
2.  **Utworzenie serwisu**: Stwórz nowy plik serwisu `src/lib/services/dashboard.service.ts` wraz z plikiem testowym `dashboard.service.test.ts`.
3.  **Implementacja logiki serwisu**: W `DashboardService` zaimplementuj metodę `getDashboardData(userId, month)`, która będzie zawierać logikę pobierania i agregowania danych z Supabase.
4.  **Integracja z AI**: W `DashboardService` dodaj logikę do komunikacji z API OpenAI w celu generowania podsumowania. Użyj zmiennej środowiskowej dla klucza API.
5.  **Utworzenie punktu końcowego API**: Stwórz plik `src/pages/api/dashboard.ts` dla nowego punktu końcowego Astro.
6.  **Implementacja handlera API**: W pliku `dashboard.ts` zaimplementuj handler `GET`, który:
    - Użyje `Astro.locals.supabase` do interakcji z Supabase.
    - Zwaliduje parametr `month` przy użyciu schematu Zod.
    - Wywoła `DashboardService` w celu pobrania danych.
    - Obsłuży błędy i zwróci odpowiednie kody statusu.
    - Zwróci dane w formacie JSON.
7.  **Testy integracyjne**: Stwórz plik `src/pages/api/dashboard.test.ts` i napisz testy integracyjne dla punktu końcowego, obejmujące przypadki sukcesu, błędów walidacji i braku autoryzacji.
8.  **Dokumentacja**: Zaktualizuj dokumentację API (jeśli istnieje), aby odzwierciedlić nowy punkt końcowy.

