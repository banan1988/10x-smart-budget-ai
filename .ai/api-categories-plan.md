# Plan Implementacji Punktu Końcowego: GET /api/categories

## 1. Cel
Stworzenie punktu końcowego API (`GET /api/categories`), który będzie zwracał listę wszystkich globalnych kategorii produktów i usług. Dane te będą wykorzystywane przez aplikację kliencką do dynamicznego renderowania opcji kategoryzacji, np. w formularzach dodawania transakcji.

## 2. Wymagania Funkcjonalne
- Punkt końcowy musi być dostępny pod adresem `/api/categories` i obsługiwać metodę `GET`.
- Dostęp do punktu końcowego musi być chroniony i wymagać uwierzytelnienia użytkownika.
- W przypadku braku uwierzytelnienia, serwer musi zwrócić status `401 Unauthorized`.
- Punkt końcowy powinien pobierać dane z tabeli `categories` w bazie danych Supabase.
- Zwracane dane powinny być w formacie `JSON` i stanowić tablicę obiektów.
- Każdy obiekt w tablicy powinien mieć strukturę zgodną z `CategoryDto`.

## 3. Struktura Danych (DTO)
W pliku `src/types.ts` zostanie wykorzystany lub zdefiniowany następujący Data Transfer Object (DTO) dla kategorii:

```typescript
export interface CategoryDto {
  id: number;
  key: string;
  name: string;
}
```
Pole `name` będzie pochodzić z kolumny `translations` (obiekt JSON) z tabeli `categories`, używając polskiego tłumaczenia (`pl`).

## 4. Logika Biznesowa
- Logika pobierania i transformacji danych zostanie umieszczona w dedykowanym serwisie `CategoryService` w pliku `src/lib/services/category.service.ts`.
- Serwis będzie zawierał metodę `getGlobalCategories(supabase: SupabaseClient)`, która:
    1. Wykona zapytanie do Supabase w celu pobrania wszystkich rekordów z tabeli `categories`.
    2. Obsłuży potencjalne błędy zapytania do bazy danych.
    3. Zmapuje wyniki z bazy danych na tablicę obiektów `CategoryDto[]`, pobierając polskie tłumaczenie dla nazwy kategorii.
    4. Zwróci przetworzoną listę kategorii.

## 5. Implementacja Punktu Końcowego (API Route)
- W pliku `src/pages/api/categories.ts` zostanie zaimplementowany handler `GET`.
- Handler będzie oznaczony jako `export const prerender = false;` w celu zapewnienia renderowania po stronie serwera.
- Handler pobierze instancję klienta Supabase z `context.locals.supabase`, która jest dostarczana przez middleware.
- Wywoła metodę `CategoryService.getGlobalCategories` w bloku `try...catch`.
- W przypadku sukcesu, zwróci odpowiedź `JSON` z tablicą kategorii i statusem `200 OK`.
- W przypadku błędu (np. błędu serwisu), zaloguje błąd i zwróci odpowiedź ze statusem `500 Internal Server Error` i stosownym komunikatem.

## 6. Bezpieczeństwo
- Middleware Astro (`src/middleware/index.ts`) jest odpowiedzialne za weryfikację sesji użytkownika dla wszystkich ścieżek `/api/*`. Należy upewnić się, że ta ochrona działa zgodnie z oczekiwaniami.
- Zapytanie do bazy danych jest statyczne (nie przyjmuje parametrów od użytkownika), co eliminuje ryzyko SQL Injection.

## 7. Plan Działania
1.  **Utworzenie pliku z planem**: Stworzyć plik `api-categories-plan.md` w katalogu `.ai` w celu udokumentowania planu (ten krok).
2.  **Weryfikacja/Aktualizacja typów**: Sprawdzić, czy interfejs `CategoryDto` istnieje w `src/types.ts` i czy jest zgodny z wymaganiami.
3.  **Utworzenie serwisu**: Stworzyć plik `src/lib/services/category.service.ts` i zaimplementować w nim klasę `CategoryService` z metodą `getGlobalCategories`.
4.  **Utworzenie punktu końcowego**: Stworzyć plik `src/pages/api/categories.ts` i zaimplementować w nim handler `GET` zgodnie z powyższymi wytycznymi.
5.  **Testowanie**: Po implementacji przeprowadzić ręczne testy punktu końcowego, sprawdzając scenariusze:
    - Dostęp uwierzytelniony (oczekiwany status `200 OK` i lista kategorii).
    - Dostęp nieuwierzytelniony (oczekiwany status `401 Unauthorized`).

