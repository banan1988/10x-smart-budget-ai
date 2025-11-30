# Plan implementacji widoku Panel Administratora - Statystyki AI Kategoryzacji

## 1. Przegląd

Panel Administratora - Statystyki AI Kategoryzacji (`/profile/admin/stats`) umożliwia administatorom monitorowanie efektywności automatycznej kategoryzacji wydatków przy użyciu AI. Widok prezentuje zagregowane metryki (% AI kategoryzacji, liczba transakcji), rozbicie po kategoriach w tabelce, wizualizacje (Donut/Pie chart, Line chart trendu) oraz filtry czasowe. Dostęp ograniczony do użytkowników z rolą `admin`.

## 2. Routing widoku

- **Ścieżka:** `/profile/admin/stats`
- **Typ:** Chroniona strona dostępna tylko dla zalogowanych użytkowników z rolą `admin`
- **Middleware:** Sprawdzenie autentykacji + roli `admin` - jeśli użytkownik nie ma roli admina, redirect na `/profile` z komunikatem błędu
- **Plik:** `src/pages/profile/admin/stats.astro`

## 3. Struktura komponentów

```
AdminAiStatsPage (Astro)
├── AdminLayout (Astro)
│   ├── AdminHeader (React)
│   ├── AdminSidebar (React)
│   └── Main Content
│       ├── PageHeader
│       ├── DateRangeFilter (React)
│       ├── MetricsGrid (React)
│       │   ├── MetricsCard (% AI kategoryzacji)
│       │   ├── MetricsCard (liczba AI transakcji)
│       │   ├── MetricsCard (liczba ręcznych transakcji)
│       │   └── MetricsCard (trend)
│       ├── ChartsGrid (React)
│       │   ├── AiCategorizationChart (Donut/Pie)
│       │   └── TrendChart (Line chart)
│       ├── CategoryStatsTable (React)
│       └── Pagination (Shadcn/ui)
```

## 4. Szczegóły komponentów

### AdminAiStatsPage (admin/ai-stats.astro)

- **Opis komponentu:** Strona główna panelu statystyk AI kategoryzacji. Komponent Astro odpowiadający za layout, pobieranie danych z API i renderowanie zawartości. Zawiera logikę autentykacji admina.
- **Główne elementy:**
  - AdminLayout wrapper z header i sidebar
  - Sekcja nagłówka strony ("Statystyki AI Kategoryzacji")
  - Komponenty React dla interaktywnej zawartości
- **Obsługiwane interakcje:** Zmiana zakresu dat, paginacja
- **Obsługiwana walidacja:** Sprawdzenie roli admina w middleware
- **Typy:** Brak
- **Propsy:** Brak

### DateRangeFilter (React)

- **Opis komponentu:** Filtr czasowy umożliwiający administratorowi wybranie zakresu dat do analizy AI kategoryzacji.
- **Główne elementy:**
  - Label "Zakres dat"
  - DatePicker "Od" (startDate)
  - DatePicker "Do" (endDate)
  - Predefiniowane opcje: "Ostatnie 7 dni", "Ostatnie 30 dni", "Cały miesiąc" (opcjonalnie)
  - Przycisk "Zastosuj"
  - Przycisk "Resetuj"
- **Obsługiwane interakcje:**
  - Zmiana daty w DatePicker
  - Klik na predefiniowaną opcję - automat ustawienie daty
  - Klik "Zastosuj" - fetch danych z nowymi datami
  - Klik "Resetuj" - reset do domyślnego zakresu (ostatnie 30 dni)
- **Obsługiwana walidacja:**
  - Data "Od" nie może być po dacie "Do"
  - Daty mają format YYYY-MM-DD
  - Data nie może być w przyszłości
- **Typy:** DateRangeFilterProps, DateRange
- **Propsy:**
  - `onDateRangeChange: (range: DateRange) => void`
  - `isLoading?: boolean`
  - `defaultRange?: DateRange`

### AiCategorizationChart (React)

- **Opis komponentu:** Donut/Pie chart (Recharts) pokazujący proporcje transakcji kategoryzowanych przez AI vs. ręcznie.
- **Główne elementy:**
  - Donut/Pie chart z dwoma segmentami:
    - AI kategoryzacje (np. zielony)
    - Ręczne kategoryzacje (np. niebieski)
  - Legenda z liczbami i procentami
  - Center text (opcjonalnie): "% AI"
  - Tooltip przy hover
  - Responsive container
- **Obsługiwane interakcje:** Hover na segment - tooltip
- **Obsługiwana walidacja:** Brak
- **Typy:** AiCategorizationChartProps
- **Propsy:**
  - `aiCount: number`
  - `manualCount: number`
  - `height?: number`
  - `isLoading?: boolean`

### TrendChart (React)

- **Opis komponentu:** Line chart (Recharts) pokazujący trend procentu AI kategoryzacji na przestrzeni czasu (domyślnie ostatnie 30 dni z podziałem dziennym).
- **Główne elementy:**
  - Line chart z Recharts
  - Oś X: daty (format: DD-MM)
  - Oś Y: procent (0-100%)
  - Linia trendu AI (np. niebieska)
  - Opcjonalnie: area fill pod linią
  - Legenda
  - Tooltip przy hover
  - Responsive container
- **Obsługiwane interakcje:** Hover na punkt - tooltip
- **Obsługiwana walidacja:** Brak
- **Typy:** TrendChartProps
- **Propsy:**
  - `data: { date: string; percentage: number }[]`
  - `height?: number`
  - `isLoading?: boolean`

### CategoryStatsTable (React)

- **Opis komponentu:** Tabela wyświetlająca statystyki kategoryzacji dla każdej kategorii wydatków.
- **Główne elementy:**
  - Kolumny: 
    - Kategoria (nazwa)
    - AI (liczba transakcji AI)
    - Ręczne (liczba ręcznych kategoryzacji)
    - % AI (procent AI dla tej kategorii)
    - Trend (ikona z kierunkiem: ↑/↓/→)
  - Sortowanie po kliknięciu na nagłówek
  - Responsive tabela
  - Highlight rządów z niskim % AI (np. <50%) - background warning
- **Obsługiwane interakcje:**
  - Klik na nagłówek - zmiana sortowania
  - Hover na rząd - highlight
  - Klik na rząd (opcjonalnie) - modal z szczegółami kategorii
- **Obsługiwana walidacja:**
  - AI + Ręczne > 0
  - % musi być 0-100
  - Trend musi być: up/down/neutral
- **Typy:** CategoryStatsTableProps, CategoryStats
- **Propsy:**
  - `data: CategoryStats[]`
  - `onSort: (field: string, direction: 'asc' | 'desc') => void`
  - `isLoading?: boolean`

### TrendBadge (React)

- **Opis komponentu:** Mały komponent wyświetlający trend dla wskaźnika (ikona + tekst).
- **Główne elementy:**
  - Ikona trendu: ↑ (zielona), ↓ (czerwona), → (szara)
  - Tekst z wartością: np. "+5%", "-2%", "→0%"
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** TrendBadgeProps
- **Propsy:**
  - `direction: 'up' | 'down' | 'neutral'`
  - `percentage?: number`
  - `variant?: 'success' | 'danger' | 'neutral'`

### ExportButton (React)

- **Opis komponentu:** Przycisk do eksportu statystyk AI do pliku CSV/PDF.
- **Główne elementy:**
  - Przycisk z ikoną download
  - Dropdown menu z opcjami: CSV, (opcjonalnie PDF)
  - Loading state podczas eksportu
- **Obsługiwane interakcje:** Klik na przycisk - otwarcie menu, klik na opcję - eksport
- **Obsługiwana walidacja:** Brak
- **Typy:** ExportButtonProps
- **Propsy:**
  - `data: CategoryStats[]`
  - `trendData?: { date: string; percentage: number }[]`
  - `fileName?: string`
  - `isLoading?: boolean`

## 5. Typy

### CategoryStats

```typescript
interface CategoryStats {
  categoryId: number;
  categoryName: string; // np. "Jedzenie", "Transport"
  categoryKey: string; // np. "food", "transport"
  aiCount: number; // liczba transakcji kategoryzowanych przez AI
  manualCount: number; // liczba ręcznie kategoryzowanych transakcji
  total: number; // aiCount + manualCount
  aiPercentage: number; // (aiCount / total) * 100
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage?: number; // zmiana od poprzedniego okresu, np. +5
  };
}
```

### AiCategorizationStatsDto

```typescript
interface AiCategorizationStatsDto {
  period: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
  overall: {
    totalTransactions: number;
    aiCategorized: number;
    manuallyCategorized: number;
    aiPercentage: number; // (aiCategorized / totalTransactions) * 100
  };
  categoryBreakdown: CategoryStats[];
  trendData: {
    date: string; // YYYY-MM-DD
    percentage: number; // % AI dla tego dnia
  }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### DateRange

```typescript
interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
```

### CategoryStatsTableProps

```typescript
interface CategoryStatsTableProps {
  data: CategoryStats[];
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
}
```

### TrendBadgeProps

```typescript
interface TrendBadgeProps {
  direction: 'up' | 'down' | 'neutral';
  percentage?: number;
  variant?: 'success' | 'danger' | 'neutral';
}
```

### DateRangeFilterProps

```typescript
interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
  isLoading?: boolean;
  defaultRange?: DateRange;
  showPresets?: boolean;
}
```

### Zod Schemas

```typescript
export const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const AiStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
  sortBy: z.enum(['category', 'ai', 'manual', 'aiPercentage']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type AiStatsQueryInput = z.infer<typeof AiStatsQuerySchema>;
```

## 6. Zarządzanie stanem

### Stan lokalny komponentu AdminAiStatsPage (Astro)

- Pobieranie danych z API w Server Component: `GET /api/admin/ai-stats`
- Passing danych do React komponentów jako props

### Stan lokalny komponentów React

**AiStatsView (React wrapper):**
- `dateRange: DateRange` - wybrany zakres dat
- `stats: AiCategorizationStatsDto` - zagregowane statystyki
- `categoryStats: CategoryStats[]` - statystyki per kategoria
- `trendData: { date: string; percentage: number }[]` - dane trendu
- `isLoading: boolean` - podczas pobierania danych
- `error: Error | null` - obsługa błędów
- `sortConfig: { field: string; direction: 'asc' | 'desc' }` - konfiguracja sortowania tabeli
- `pagination: PaginationInfo` - informacja o paginacji kategorii

**Funkcje:**
- `handleDateRangeChange(range: DateRange)` - zmiana zakresu dat, fetch nowych danych
- `handleSort(field: string, direction)` - zmiana sortowania w tabeli
- `handlePageChange(page: number)` - zmiana strony
- `handleExport()` - eksport danych do CSV

### Custom Hook: `useAiStatsAdmin`

```typescript
interface UseAiStatsAdminReturn {
  stats: AiCategorizationStatsDto | null;
  isLoading: boolean;
  error: Error | null;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  refetch: () => void;
  exportToCSV: (filename?: string) => void;
}

export function useAiStatsAdmin(initialDateRange?: DateRange): UseAiStatsAdminReturn {
  // implementacja...
}
```

## 7. Integracja API

### Endpoints wymagane

#### `GET /api/admin/ai-stats`

**Wymagane uprawnienia:** Rola `admin`

**Query Parameters:**
- `startDate` (string, optional): YYYY-MM-DD (domyślnie: 30 dni temu)
- `endDate` (string, optional): YYYY-MM-DD (domyślnie: dzisiaj)
- `page` (number, optional): Numer strony dla categoryBreakdown (default: 1)
- `limit` (number, optional): Liczba kategorii per stronę (default: 20, max: 100)
- `sortBy` (string, optional): 'category' | 'ai' | 'manual' | 'aiPercentage'
- `sortOrder` (string, optional): 'asc' | 'desc'

**Response (200 OK):**
```typescript
{
  period: {
    startDate: "2025-11-01",
    endDate: "2025-11-30"
  },
  overall: {
    totalTransactions: 150,
    aiCategorized: 120,
    manuallyCategorized: 30,
    aiPercentage: 80
  },
  categoryBreakdown: [
    {
      categoryId: 101,
      categoryName: "Jedzenie",
      categoryKey: "food",
      aiCount: 45,
      manualCount: 5,
      total: 50,
      aiPercentage: 90,
      trend: {
        direction: "up",
        percentage: 5
      }
    }
  ],
  trendData: [
    { date: "2025-11-01", percentage: 75 },
    { date: "2025-11-02", percentage: 78 },
    // ... więcej danych
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 12,
    totalPages: 1
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Brak autentykacji
- `403 Forbidden`: Brak roli `admin`
- `400 Bad Request`: Nieprawidłowe parametry
- `500 Internal Server Error`: Błąd serwera

## 8. Interakcje użytkownika

1. **Otwarcie strony:**
   - Administrator wchodzi na `/admin/ai-stats`
   - Middleware sprawdza rolę - jeśli nie admin, redirect na `/dashboard`
   - Strona ładuje statystyki AI (domyślnie ostatnie 30 dni)
   - Wyświetlane są: metryki overall, wykresy (Donut, Line chart), tabela kategorii

2. **Zmiana zakresu dat:**
   - Administrator ustawia nową datę "Od" i "Do" w DateRangeFilter
   - Klika "Zastosuj" lub wybiera preset "Ostatnie 7 dni"
   - API fetch z nowymi datami
   - Wszystkie wizualizacje i tabela się aktualizują

3. **Sortowanie tabeli kategorii:**
   - Administrator klika na nagłówek kolumny (np. "% AI")
   - Tabela sortuje się rosnąco/malejąco
   - Ikona sortowania pojawia się w nagłówku

4. **Paginacja kategorii:**
   - Jeśli jest więcej niż 20 kategorii, paginacja pojawia się
   - Administrator klika "Next" lub przychodzi bezpośrednio na stronę 2
   - Tabela wyświetla następne kategorie

5. **Analiza danych:**
   - Administrator przegląda:
     - Metrykę % AI kategoryzacji (np. 80%)
     - Donut chart pokazujący proporcje AI vs. ręczne
     - Line chart pokazujący trend w czasie
     - Tabelę kategorii z wyszczególnieniem dla każdej
   - Widzi trenty (↑/↓/→) dla każdej kategorii
   - Może zidentyfikować kategorie z niskim wskaźnikiem AI (np. <50%)

6. **Eksport danych:**
   - Administrator klika przycisk "Eksportuj"
   - Widzi dropdown menu z opcjami CSV
   - Klika CSV
   - Plik CSV zostaje pobrany z danymi z aktualnego zakresu dat

7. **Resetowanie do domyślnego zakresu:**
   - Administrator klika "Resetuj" w DateRangeFilter
   - Zakres resetuje się do "Ostatnie 30 dni"
   - Dane odświeżają się

## 9. Warunki i walidacja

### Walidacja zakresu dat

- **Data "Od":**
  - Format: YYYY-MM-DD
  - Nie może być po dacie "Do"
  - Nie może być w przyszłości
- **Data "Do":**
  - Format: YYYY-MM-DD
  - Nie może być przed datą "Od"
  - Domyślnie: dzisiaj
  - Nie może być w przyszłości

### Walidacja danych z API

- **aiCount, manualCount, total:** Must be >= 0
- **aiPercentage:** Must be 0-100
- **date (trendData):** Valid YYYY-MM-DD format
- **percentage (trendData):** 0-100

### Paginacja kategorii

- **Page:** Must be >= 1
- **Limit:** Between 1 and 100, default 20
- **Total:** Server zwraca totalPages

## 10. Obsługa błędów

### Błędy walidacji (frontend)

- **Data "Od" po dacie "Do":**
  - Wyświetlenie: Toast notification "Data 'Od' nie może być po dacie 'Do'"
  - Kolor: Żółty (warning)
  - Akcja: Disable przycisku "Zastosuj"

- **Data w przyszłości:**
  - Wyświetlenie: Komunikat walidacji
  - Automatyczne resetowanie na dzisiaj

### Błędy serwera

- **401 Unauthorized:**
  - Wyświetlenie: Toast "Brak uprawnień. Wylogowuję..."
  - Akcja: Redirect na `/login` po 2 sekundach

- **403 Forbidden:**
  - Wyświetlenie: Toast "Nie masz dostępu do tego zasobu"
  - Akcja: Redirect na `/dashboard`

- **500 Internal Server Error:**
  - Wyświetlenie: Toast "Błąd serwera. Spróbuj ponownie."
  - Akcja: Przycisk retry do ponownego fetch

- **Network error/Timeout:**
  - Wyświetlenie: Toast "Błąd połączenia. Spróbuj ponownie."
  - Akcja: Przycisk retry

### Scenariusze brzegowe

- **Brak transakcji w wybranym zakresie:**
  - Wyświetlenie: EmptyState z komunikatem "Brak danych dla wybranego zakresu"
  - Przycisk "Resetuj filtry"

- **AI kategoryzacja 0% (wszystkie ręczne):**
  - Donut chart pokazuje 100% segment ręczny
  - Tabela pokazuje 0% AI dla wszystkich kategorii

- **Bardzo duża liczba kategorii (>100):**
  - Paginacja zapewnia sensowne pobieranie
  - Limit 100 per page maksymalnie

## 11. Kroki implementacji

### Etap 1: Przygotowanie struktury i typów

1. **Utwórz folder admin (jeśli jeszcze nie istnieje):**
   - `src/pages/profile/admin/` - folder na admin pages
   - `src/layouts/AdminLayout.astro` - dedykowany layout (jeśli nie istnieje)

2. **Definiuj typy w `src/types.ts`:**
   - CategoryStats
   - AiCategorizationStatsDto
   - DateRange
   - CategoryStatsTableProps
   - TrendBadgeProps
   - DateRangeFilterProps

3. **Utwórz Zod schematy w `src/types.ts`:**
   - DateRangeSchema
   - AiStatsQuerySchema

### Etap 2: Implementacja komponentów React

3. **Utwórz `src/components/admin/DateRangeFilter.tsx`:**
   - DatePicker dla startDate/endDate
   - Predefiniowane opcje (Ostatnie 7/30 dni)
   - Przyciski "Zastosuj" i "Resetuj"
   - Walidacja na frontend

4. **Utwórz `src/components/admin/AiCategorizationChart.tsx`:**
   - Donut/Pie chart z Recharts
   - Responsive container
   - Loading skeleton

5. **Utwórz `src/components/admin/TrendChart.tsx`:**
   - Line chart z Recharts
   - Responsive container
   - Tooltip i legenda
   - Loading skeleton

6. **Utwórz `src/components/TrendBadge.tsx`:**
   - Ikona trendu + tekst
   - Kolorowanie (zielony/czerwony/szary)

7. **Utwórz `src/components/admin/CategoryStatsTable.tsx`:**
   - Tabela z Shadcn/ui Table
   - Kolumny: Kategoria, AI, Ręczne, % AI, Trend
   - Sortowanie po nagłówkach
   - Highlight niskich % AI

8. **Utwórz custom hook `src/components/hooks/useAiStatsAdmin.ts`:**
   - Zarządzanie stanem dateRange, danych, sortowania
   - Fetch z API
   - Obsługa błędów

9. **Utwórz `src/components/admin/AiStatsView.tsx`:**
   - Główny komponent integrowany dla widoku AI stats
   - Używa `useAiStatsAdmin` hook
   - Renderuje DateRangeFilter, MetricsGrid, wykresy, tabelę

### Etap 3: Implementacja API (backend)

10. **Zaktualizuj service `src/lib/services/transaction.service.ts` lub `ai.service.ts`:**
    - Funkcja `getAiCategorizationStats(supabase, dateRange, pagination?)` - pobiera statystyki AI kategoryzacji

11. **Utwórz endpoint `src/pages/api/admin/ai-stats.ts`:**
    - Handler GET
    - Sprawdzenie roli admin (middleware + RLS)
    - Walidacja query parameters
    - Pobieranie danych za pośrednictwem service
    - Obliczanie trendu (porównanie z poprzednim okresem)
    - Error handling

### Etap 4: Implementacja strony Astro

12. **Utwórz `src/pages/profile/admin/stats.astro`:**
    - Użycie AdminLayout
    - Pobieranie danych z API endpoint (`GET /api/admin/ai-stats`)
    - Passing danych do React komponentów
    - Obsługa błędów

### Etap 5: Styling i accessibility

13. **Stylowanie Tailwind:**
    - Używaj `@layer` dla consistency
    - Ciemny tryb (dark: variant)
    - Responsive design (mobile-first)
    - Focus states dla accessibility
    - Loading states (skeleton, spinner)
    - Empty states
    - Warning colors dla niskich % AI

14. **Accessibility (ARIA):**
    - `aria-label` dla przycisków
    - `aria-describedby` dla pól
    - `aria-sort` dla sortowania
    - Color contrast WCAG AA
    - Alternative text dla wykresów (tabela danych)

### Etap 6: Testing i walidacja

15. **Testy jednostkowe:**
    - Unit test dla AiCategorizationChart
    - Unit test dla TrendChart
    - Unit test dla DateRangeFilter
    - Unit test dla `useAiStatsAdmin` hook

16. **Testy integracyjne:**
    - Integration test dla `/admin/ai-stats` strony
    - API test dla GET `/api/admin/ai-stats`

17. **Testowanie manualne:**
    - Poprawne pobieranie i wyświetlanie danych
    - Zmiana zakresu dat i odświeżanie
    - Sortowanie tabeli kategorii
    - Paginacja
    - Eksport do CSV
    - Accessibility (keyboard, screen reader)
    - Responsive design
    - Error handling

### Etap 7: Opracowanie dokumentacji

18. **Dokumentacja kodu:**
    - JSDoc komentarze
    - Inline komentarze dla złożonej logiki

19. **Code review:**
    - Spełniają się wymagania
    - Kod czysty i czytelny
    - Error handling kompletny
    - Security (RLS, auth checks)
    - Performance
    - Accessibility WCAG 2.1 AA

