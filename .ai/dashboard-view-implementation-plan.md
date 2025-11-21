# Plan implementacji widoku Pulpit Nawigacyjny

## 1. Przegląd
Widok Pulpitu Nawigacyjnego (Dashboard) ma na celu prezentację kluczowych wskaźników finansowych użytkownika za bieżący miesiąc. Umożliwia szybki przegląd przychodów, wydatków, bilansu oraz analizę głównych kategorii wydatków. Dodatkowo, widok oferuje tekstowe podsumowanie finansów wygenerowane przez AI i zapewnia łatwy dostęp do dodawania nowych transakcji.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/dashboard`. Dostęp do tej ścieżki powinien być chroniony i wymagać uwierzytelnienia użytkownika, co jest realizowane przez middleware w Astro.

## 3. Struktura komponentów
```
/dashboard (Astro Page)
└── DashboardView (React Component)
    ├── MetricCard (React Component) - (x3: Przychody, Wydatki, Bilans)
    ├── CategoriesBarChart (React Component)
    ├── AiSummary (React Component)
    ├── Button "Dodaj transakcję" (Shadcn/ui)
    └── AddTransactionDialog (React Component)
    └── DashboardSkeleton (React Component) - (Wyświetlany podczas ładowania)
    └── EmptyState (React Component) - (Wyświetlany przy braku danych)
```

## 4. Szczegóły komponentów

### DashboardView
- **Opis komponentu**: Główny kontener widoku, który orkiestruje pobieranie danych, zarządzanie stanem i renderowanie komponentów podrzędnych.
- **Główne elementy**: Wykorzystuje `MetricCard` do wyświetlania statystyk, `CategoriesBarChart` do wizualizacji wydatków, `AiSummary` do podsumowania AI oraz przycisk otwierający `AddTransactionDialog`. Implementuje logikę do wyświetlania `DashboardSkeleton` i `EmptyState`.
- **Obsługiwane interakcje**: Otwarcie modalu dodawania transakcji, odświeżenie danych po dodaniu transakcji.
- **Typy**: `DashboardVM`
- **Propsy**: Brak.

### MetricCard
- **Opis komponentu**: Karta do wyświetlania pojedynczej metryki finansowej (np. "Przychody") wraz z tytułem i wartością.
- **Główne elementy**: `Card`, `CardHeader`, `CardTitle`, `CardContent` z Shadcn/ui.
- **Obsługiwane interakcje**: Brak.
- **Typy**: `MetricCardVM`
- **Propsy**: `metric: MetricCardVM`

### CategoriesBarChart
- **Opis komponentu**: Wykres słupkowy prezentujący top 5 kategorii wydatków w bieżącym miesiącu.
- **Główne elementy**: Komponent wykresu z biblioteki `recharts` (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`).
- **Obsługiwane interakcje**: Wyświetlanie szczegółów (tooltip) po najechaniu na słupek.
- **Typy**: `CategoryBreakdownVM[]`
- **Propsy**: `data: CategoryBreakdownVM[]`

### AiSummary
- **Opis komponentu**: Komponent wyświetlający tekstowe podsumowanie sytuacji finansowej wygenerowane przez AI.
- **Główne elementy**: Blok tekstu, potencjalnie z ikoną informacyjną.
- **Obsługiwane interakcje**: Brak.
- **Typy**: `string`
- **Propsy**: `summary: string`

### DashboardSkeleton
- **Opis komponentu**: Wskaźnik ładowania, który naśladuje układ pulpitu nawigacyjnego, zapewniając lepsze wrażenia użytkownika (UX).
- **Główne elementy**: Komponenty `Skeleton` z Shadcn/ui ułożone w strukturę siatki.
- **Obsługiwane interakcje**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### EmptyState
- **Opis komponentu**: Komponent wyświetlany, gdy dla danego miesiąca nie ma żadnych transakcji. Zachęca użytkownika do podjęcia akcji.
- **Główne elementy**: Tekst informacyjny oraz przycisk "Dodaj transakcję" (`Button` z Shadcn/ui).
- **Obsługiwane interakcje**: Otwarcie modalu `AddTransactionDialog`.
- **Typy**: Brak.
- **Propsy**: `onAddTransaction: () => void`

## 5. Typy

### `DashboardVM`
ViewModel dla całego pulpitu nawigacyjnego.
```typescript
interface DashboardVM {
  metrics: MetricCardVM[];
  categoryBreakdown: CategoryBreakdownVM[];
  aiSummary?: string;
}
```

### `MetricCardVM`
ViewModel dla pojedynczej karty z metryką.
```typescript
interface MetricCardVM {
  title: string; // np. "Przychody"
  value: string; // sformatowana kwota, np. "10 000,00 zł"
}
```

### `CategoryBreakdownVM`
ViewModel dla pojedynczej kategorii na wykresie.
```typescript
interface CategoryBreakdownVM {
  name: string; // Nazwa kategorii, np. "Jedzenie"
  total: number; // Suma wydatków w tej kategorii
}
```

## 6. Zarządzanie stanem
Stan widoku będzie zarządzany wewnątrz komponentu `DashboardView` przy użyciu hooków `useState` i `useEffect`. Do pobierania i zarządzania danymi z API zostanie stworzony dedykowany custom hook `useDashboardStats`.

### `useDashboardStats`
- **Cel**: Abstrakcja logiki pobierania, cachowania i odświeżania statystyk pulpitu.
- **Stan wewnętrzny**:
  - `data: DashboardVM | null`
  - `isLoading: boolean`
  - `error: Error | null`
- **Funkcje**:
  - `refetch()`: Funkcja do manualnego ponownego pobrania danych.
- **Użycie**: Hook będzie wywoływany w `DashboardView` do pobrania danych przy pierwszym renderowaniu oraz po dodaniu nowej transakcji.

## 7. Integracja API
Integracja z backendem odbywa się poprzez wywołanie endpointu `GET /api/transactions/stats`.

- **Żądanie**:
  - **Metoda**: `GET`
  - **URL**: `/api/transactions/stats`
  - **Query Params**:
    - `month` (string, wymagany): Aktualny miesiąc w formacie `YYYY-MM`.
    - `includeAiSummary` (boolean, opcjonalny): Ustawiony na `true`, aby otrzymać podsumowanie AI.

- **Odpowiedź (sukces, 200 OK)**:
  - **Typ**: `TransactionStatsDto`
  ```json
  {
    "month": "2025-11",
    "totalIncome": 10000,
    "totalExpenses": 2500,
    "balance": 7500,
    "categoryBreakdown": [
      { "categoryName": "Jedzenie", "total": 1500, ... },
      { "categoryName": "Transport", "total": 1000, ... }
    ],
    "aiSummary": "W listopadzie Twoje saldo jest pozytywne..."
  }
  ```
- **Mapowanie DTO na ViewModel**: Odpowiedź `TransactionStatsDto` zostanie zmapowana na `DashboardVM` wewnątrz hooka `useDashboardStats` w celu przygotowania danych do wyświetlenia.

## 8. Interakcje użytkownika
- **Wyświetlenie pulpitu**: Użytkownik przechodzi na `/dashboard`. Aplikacja wyświetla `DashboardSkeleton`, a w tle `useDashboardStats` pobiera dane dla bieżącego miesiąca.
- **Dodanie transakcji**:
  1. Użytkownik klika przycisk "Dodaj transakcję".
  2. Otwiera się modal `AddTransactionDialog`.
  3. Po pomyślnym dodaniu transakcji modal się zamyka, a funkcja `refetch` z `useDashboardStats` jest wywoływana w celu odświeżenia danych na pulpicie.
- **Najechanie na wykres**: Użytkownik najeżdża kursorem na słupek na wykresie `CategoriesBarChart`, co powoduje wyświetlenie tooltipa z dokładną kwotą wydatków dla danej kategorii.

## 9. Warunki i walidacja
- **Warunek**: `month` (w formacie `YYYY-MM`) jest wymagany przez API.
- **Walidacja**: Komponent `DashboardView` będzie odpowiedzialny za wygenerowanie prawidłowej wartości dla bieżącego miesiąca i przekazanie jej do hooka `useDashboardStats`. Format daty jest kluczowy dla poprawnego działania API.

## 10. Obsługa błędów
- **Błąd ładowania danych**: Jeśli `useDashboardStats` zwróci błąd (np. błąd sieci, błąd serwera 500), `DashboardView` wyświetli komunikat o błędzie z możliwością ponowienia próby (`refetch`).
- **Brak transakcji**: Jeśli API zwróci puste dane (np. `transactionCount: 0`), `DashboardView` wyświetli komponent `EmptyState` z wezwaniem do dodania pierwszej transakcji.
- **Brak autoryzacji (401)**: Middleware Astro automatycznie przekieruje nieautoryzowanego użytkownika na stronę logowania.

## 11. Kroki implementacji
1. **Utworzenie pliku strony**: Stwórz plik `src/pages/dashboard.astro`, który będzie renderował główny komponent React.
2. **Stworzenie głównego komponentu**: Stwórz komponent `src/components/DashboardView.tsx`, który będzie sercem widoku.
3. **Implementacja hooka `useDashboardStats`**: Stwórz hook `src/components/hooks/useDashboardStats.ts` do obsługi logiki pobierania danych z API `GET /api/transactions/stats`.
4. **Stworzenie komponentów UI**:
   - `MetricCard.tsx`: Komponent do wyświetlania pojedynczej metryki.
   - `CategoriesBarChart.tsx`: Komponent wykresu z użyciem `recharts`. Zainstaluj `recharts`, jeśli to konieczne (`npm install recharts`).
   - `AiSummary.tsx`: Prosty komponent do wyświetlania podsumowania AI.
   - `DashboardSkeleton.tsx`: Komponent szkieletu ładowania.
   - `EmptyState.tsx`: Komponent stanu pustego.
5. **Integracja komponentów**: Złóż wszystkie komponenty w `DashboardView.tsx`, implementując logikę warunkowego renderowania (ładowanie, błąd, stan pusty, widok z danymi).
6. **Podłączenie `AddTransactionDialog`**: Zintegruj istniejący komponent `AddTransactionDialog` i zapewnij odświeżanie danych po pomyślnym dodaniu transakcji.
7. **Stylowanie i RWD**: Użyj Tailwind CSS do ostylowania komponentów i zapewnienia responsywności, zgodnie z wymaganiami (karty w jednej kolumnie na mobile).
8. **Testowanie**: Napisz testy jednostkowe dla hooka `useDashboardStats` i testy komponentów, aby zweryfikować poprawność renderowania w różnych stanach (ładowanie, dane, błąd).

