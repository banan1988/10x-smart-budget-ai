# API Endpoint Implementation Plan: GET /api/categories

## 1. Przegląd punktu końcowego
Punkt końcowy `GET /api/categories` ma na celu dostarczenie listy wszystkich globalnych kategorii produktów i usług. Dane te będą wykorzystywane przez aplikację kliencką do dynamicznego renderowania opcji kategoryzacji, np. w formularzach dodawania transakcji, zapewniając spójność danych w całej aplikacji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/categories`
- **Parametry**:
    - Wymagane: Brak
    - Opcjonalne: Brak
- **Request Body**: Brak (dla metody GET)

## 3. Wykorzystywane typy
Do implementacji tego punktu końcowego wykorzystany zostanie następujący Data Transfer Object (DTO), zdefiniowany w `src/types.ts`:

```typescript
export interface CategoryDto {
  id: number;
  key: string;
  name: string;
}
```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca tablicę obiektów `CategoryDto` w formacie JSON.
  ```json
  [
    { "id": 1, "key": "groceries", "name": "Zakupy spożywcze" },
    { "id": 2, "key": "transport", "name": "Transport" },
    ...
  ]
  ```
- **Odpowiedzi błędów**:
    - `401 Unauthorized`: Zwracany, gdy użytkownik nie jest uwierzytelniony.
    - `500 Internal Server Error`: Zwracany w przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych
1.  Klient wysyła żądanie `GET` na adres `/api/categories`.
2.  Middleware Astro weryfikuje token uwierzytelniający użytkownika.
3.  Handler punktu końcowego w `src/pages/api/categories.ts` wywołuje metodę `getGlobalCategories` z serwisu `CategoryService`.
4.  `CategoryService` wykonuje zapytanie do tabeli `categories` w bazie danych Supabase.
5.  Serwis mapuje wyniki z bazy danych na tablicę `CategoryDto[]`, pobierając polskie tłumaczenie (`pl`) z kolumny `translations` dla pola `name`.
6.  Handler zwraca przetworzoną listę kategorii jako odpowiedź JSON ze statusem 200 OK.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony. Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika dla wszystkich ścieżek `/api/*`.
- **Ochrona przed SQL Injection**: Zapytanie do bazy danych jest statyczne i nie przyjmuje żadnych parametrów od użytkownika, co eliminuje ryzyko ataku SQL Injection.

## 7. Obsługa błędów
- **Brak uwierzytelnienia**: Middleware automatycznie zwróci status `401 Unauthorized`, jeśli użytkownik nie jest zalogowany.
- **Błędy serwera**: Wszelkie błędy występujące podczas pobierania lub przetwarzania danych (np. błąd połączenia z bazą danych) zostaną przechwycone w bloku `try...catch`. Błąd zostanie zalogowany, a do klienta zostanie wysłana odpowiedź ze statusem `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności
- **Buforowanie (Caching)**: Ponieważ lista kategorii jest stosunkowo statyczna, w przyszłości można rozważyć wdrożenie mechanizmu buforowania po stronie serwera (np. w pamięci lub w Redis), aby zmniejszyć liczbę zapytań do bazy danych.
- **Rozmiar odpowiedzi**: Obecnie liczba kategorii jest niewielka, więc rozmiar odpowiedzi nie stanowi problemu. W przypadku znacznego wzrostu liczby kategorii, można rozważyć paginację, chociaż nie jest to wymagane w obecnej fazie.

## 9. Etapy wdrożenia
1.  **Weryfikacja typów**: Upewnić się, że interfejs `CategoryDto` istnieje w `src/types.ts` i jest zgodny z wymaganiami.
2.  **Implementacja serwisu**: Stworzyć plik `src/lib/services/category.service.ts` i zaimplementować w nim klasę `CategoryService` z metodą `getGlobalCategories`.
3.  **Implementacja punktu końcowego**: Stworzyć plik `src/pages/api/categories.ts` i zaimplementować w nim handler `GET`.
4.  **Testowanie**: Przeprowadzić testy manualne i/lub automatyczne w celu weryfikacji:
    - Poprawności zwracanych danych dla uwierzytelnionego użytkownika.
    - Ochrony punktu końcowego (odpowiedź `401` dla nieuwierzytelnionego dostępu).
    - Obsługi błędów serwera.
