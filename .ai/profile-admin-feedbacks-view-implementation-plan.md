# Plan implementacji widoku Panel Administratora - Statystyki Feedbacków

## 1. Przegląd

Panel Administratora - Statystyki Feedbacków (`/profile/admin/feedbacks`) umożliwia administatorom przeglądanie i analizowanie opinii użytkowników zebranych za pomocą systemu feedbacków. Widok prezentuje zagregowane statystyki (średnia ocena, liczba feedbacków), rozkład ocen w formie wykresu słupkowego oraz tabelę ze szczegółowymi feedbackami z możliwościami filtrowania i sortowania. Dostęp ograniczony do użytkowników z rolą `admin`.

## 2. Routing widoku

- **Ścieżka:** `/profile/admin/feedbacks`
- **Typ:** Chroniona strona dostępna tylko dla zalogowanych użytkowników z rolą `admin`
- **Middleware:** Sprawdzenie autentykacji + roli `admin` - jeśli użytkownik nie ma roli admina, redirect na `/profile` z komunikatem błędu
- **Plik:** `src/pages/profile/admin/feedbacks.astro`

## 3. Struktura komponentów

```
AdminFeedbacksPage (Astro)
├── AdminLayout (Astro)
│   ├── AdminHeader (React)
│   ├── AdminSidebar (React)
│   └── Main Content
│       ├── PageHeader
│       ├── MetricsGrid (React)
│       │   ├── MetricsCard (liczba feedbacków)
│       │   ├── MetricsCard (średnia ocena)
│       │   └── MetricsCard (trend)
│       ├── RatingDistributionChart (React)
│       ├── FilterControls (React)
│       ├── AdminTable (React) - tabela feedbacków
│       └── Pagination (Shadcn/ui)
```

## 4. Szczegóły komponentów

### AdminFeedbacksPage (admin/feedbacks.astro)

- **Opis komponentu:** Strona główna panelu statystyk feedbacków. Komponent Astro odpowiadający za layout, pobieranie danych z API i renderowanie zawartości. Zawiera logikę autentykacji admina.
- **Główne elementy:**
  - AdminLayout wrapper z header i sidebar
  - Sekcja nagłówka strony ("Statystyki Feedbacków")
  - Komponenty React dla interaktywnej zawartości
- **Obsługiwane interakcje:** Zmiana filtrów, paginacja, sortowanie, eksport danych
- **Obsługiwana walidacja:** Sprawdzenie roli admina w middleware
- **Typy:** Brak
- **Propsy:** Brak

### AdminLayout (admin/layout.astro)

- **Opis komponentu:** Dedykowany layout dla widoków administratora. Zawiera header, sidebar, main content area. Sprawdza rolę użytkownika.
- **Główne elementy:**
  - Header z logowaniem użytkownika/sesji
  - Sidebar z nawigacją (linki do `/admin/feedbacks`, `/admin/ai-stats`)
  - Main content area (`<slot />`)
  - Footer
- **Obsługiwane interakcje:** Nawigacja, logowanie
- **Obsługiwana walidacja:** Sprawdzenie autentykacji, sprawdzenie roli `admin`
- **Typy:** Brak
- **Propsy:** Brak

### AdminHeader (React)

- **Opis komponentu:** Nagłówek dla panelu administratora zawierający informacje o sesji, branding i menu użytkownika.
- **Główne elementy:**
  - Logo/branding ("SmartBudgetAI - Panel Admin")
  - Tekst "Admin Panel" lub badge wskazujące rolę
  - Informacja o zalogowanym użytkowniku (email)
  - Przycisk wylogowania
  - ThemeToggle
- **Obsługiwane interakcje:** Klik na wylogowanie
- **Obsługiwana walidacja:** Brak
- **Typy:** AdminHeaderProps
- **Propsy:** `userEmail?: string`

### AdminSidebar (React)

- **Opis komponentu:** Nawigacja boczna dla panelu administratora. Zawiera linki do różnych sekcji admin panelu.
- **Główne elementy:**
  - Logo/branding
  - Lista linków nawigacyjnych:
    - "Statystyki Feedbacków" (`/admin/feedbacks`) - active state
    - "Statystyki AI Kategoryzacji" (`/admin/ai-stats`)
  - Separator
  - Link "Wróć do aplikacji" (`/dashboard`)
- **Obsługiwane interakcje:** Klik na linki nawigacyjne
- **Obsługiwana walidacja:** Brak
- **Typy:** AdminSidebarProps
- **Propsy:** `currentPage?: 'feedbacks' | 'ai-stats'`

### MetricsCard (React)

- **Opis komponentu:** Reusable komponent wyświetlający kluczową metrykę: tytuł, wartość, opcjonalny trend, opcjonalna ikona.
- **Główne elementy:**
  - Ikona (SVG lub z biblioteki React Icons)
  - Tytuł metryki
  - Główna wartość (liczba, procent)
  - Trend (↑/↓/→) z kolorowaniem
  - Opcjonalny podtekst/opis
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** MetricsCardProps
- **Propsy:**
  - `title: string`
  - `value: string | number`
  - `trend?: { direction: 'up' | 'down' | 'neutral'; percentage?: number }`
  - `icon?: React.ReactNode`
  - `description?: string`
  - `variant?: 'default' | 'success' | 'warning' | 'danger'`

### MetricsGrid (React)

- **Opis komponentu:** Kontener responsywny do wyświetlania wielu MetricsCard w siatce.
- **Główne elementy:**
  - Responsive grid (2-3 kolumny na dużych ekranach, 1 kolumna na mobilnych)
  - Spacing i gap między kartami
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** MetricsGridProps
- **Propsy:**
  - `children: React.ReactNode`
  - `columns?: 2 | 3 | 4`

### RatingDistributionChart (React)

- **Opis komponentu:** Bar chart (Recharts) pokazujący rozkład feedbacków po ocenach (1-5 gwiazdek).
- **Główne elementy:**
  - Bar chart z Recharts
  - Oś X: oceny 1, 2, 3, 4, 5
  - Oś Y: liczba feedbacków
  - Legenda
  - Tooltip przy hover
  - Responsive container
- **Obsługiwane interakcje:** Hover na słupku - tooltip
- **Obsługiwana walidacja:** Brak
- **Typy:** RatingDistributionChartProps
- **Propsy:**
  - `data: { rating: number; count: number }[]`
  - `height?: number`
  - `isLoading?: boolean`

### FilterControls (React)

- **Opis komponentu:** Sekcja kontroli filtrowania - umożliwia filtrowanie feedbacków po dacie i rating.
- **Główne elementy:**
  - DatePicker "Od" (start date)
  - DatePicker "Do" (end date)
  - Select/Dropdown "Rating" (All, 5, 4, 3, 2, 1)
  - Przycisk "Zastosuj" (Apply)
  - Przycisk "Wyczyść" (Clear)
- **Obsługiwane interakcje:**
  - Zmiana datę w DatePicker
  - Zmiana rating w Select
  - Klik Apply - fetch danych z nowymi filtrami
  - Klik Clear - reset filtrów
- **Obsługiwana walidacja:**
  - Data "Od" nie może być po dacie "Do"
  - Daty mają format YYYY-MM-DD
- **Typy:** FilterControlsProps, FeedbackFilters
- **Propsy:**
  - `onFilterChange: (filters: FeedbackFilters) => void`
  - `isLoading?: boolean`
  - `defaultValues?: FeedbackFilters`

### AdminTable (React) - Feedbacks

- **Opis komponentu:** Tabela wyświetlająca listę feedbacków z możliwościami sortowania i paginacji.
- **Główne elementy:**
  - Kolumny: Data (createdAt), Rating (z gwiazdkami), Komentarz, ID Użytkownika
  - Sortowanie po kliknięciu na nagłówek kolumny
  - Obsługa paginacji (poprzedni/następny)
  - Hover effect na rzędy
  - Responsywna tabela (na mobilnych może pokazywać skróconą wersję)
  - Menu kontekstowe (opcjonalnie): usuń/spam
- **Obsługiwane interakcje:**
  - Klik na nagłówek - zmiana sortowania
  - Nawigacja paginacji
  - Hover na rzędy
  - Klik na rząd - opcjonalnie modal z pełnym komentarzem
  - Klik na menu (3 kropki) - opcje (spam, delete)
- **Obsługiwana walidacja:**
  - Rating: 1-5
  - Komentarz: max 1000 znaków
  - Data: format ISO
- **Typy:** AdminTableProps, FeedbackRow
- **Propsy:**
  - `data: FeedbackRow[]`
  - `onSort: (field: string, direction: 'asc' | 'desc') => void`
  - `pagination: PaginationInfo`
  - `onPageChange: (page: number) => void`
  - `isLoading?: boolean`
  - `onDelete?: (id: number) => void`
  - `onMarkAsSpam?: (id: number) => void`

### Pagination (Shadcn/ui)

- **Opis komponentu:** Komponent paginacji z Shadcn/ui do obsługi nawigacji między stronami.
- **Główne elementy:**
  - Przyciski: Previous, Next
  - Wyświetlenie aktualnej strony i liczby stron
  - Direktni linki do stron (opcjonalnie dla małej liczby stron)
- **Obsługiwane interakcje:** Klik na przyciski/linki - zmiana strony
- **Obsługiwana walidacja:** Brak
- **Typy:** Shadcn/ui Pagination props
- **Propsy:** Standard shadcn/ui

### ExportButton (React)

- **Opis komponentu:** Przycisk do eksportu danych feedbacków do pliku CSV.
- **Główne elementy:**
  - Przycisk z ikoną download
  - Dropdown menu z opcjami: CSV, (opcjonalnie JSON)
  - Loading state podczas eksportu
- **Obsługiwane interakcje:** Klik na przycisk - otwarcie menu, klik na opcję - eksport
- **Obsługiwana walidacja:** Brak
- **Typy:** ExportButtonProps
- **Propsy:**
  - `data: FeedbackRow[]`
  - `fileName?: string`
  - `isLoading?: boolean`

## 5. Typy

### FeedbackRow

```typescript
interface FeedbackRow {
  id: number;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO string
  userId: string; // UUID - bez danych osobowych
}
```

### FeedbackStatsDto

```typescript
interface FeedbackStatsDto {
  totalFeedbacks: number;
  averageRating: number; // 0.00 - 5.00
  ratingDistribution: {
    rating: number; // 1-5
    count: number;
  }[];
  feedbacks: FeedbackRow[]; // Paginated list
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### FeedbackFilters

```typescript
interface FeedbackFilters {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  minRating?: number; // 1-5
  maxRating?: number; // 1-5
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
```

### AdminHeaderProps

```typescript
interface AdminHeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}
```

### AdminSidebarProps

```typescript
interface AdminSidebarProps {
  currentPage?: 'feedbacks' | 'ai-stats';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

### MetricsCardProps

```typescript
interface MetricsCardProps {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage?: number;
  };
  icon?: React.ReactNode;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
```

### RatingDistributionChartProps

```typescript
interface RatingDistributionChartProps {
  data: {
    rating: number;
    count: number;
  }[];
  height?: number;
  isLoading?: boolean;
}
```

### Zod Schemas

```typescript
export const FeedbackFiltersSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  maxRating: z.number().int().min(1).max(5).optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
  sortBy: z.enum(['date', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type FeedbackFiltersInput = z.infer<typeof FeedbackFiltersSchema>;
```

## 6. Zarządzanie stanem

### Stan lokalny komponentu AdminFeedbacksPage (Astro)

- Pobieranie danych z API w Server Component: `GET /api/admin/feedbacks` + `GET /api/feedbacks/stats`
- Passing danych do React komponentów jako props

### Stan lokalny komponentów React

**FeedbacksView (React wrapper):**
- `filters: FeedbackFilters` - aktywne filtry
- `feedbacks: FeedbackRow[]` - lista feedbacków
- `stats: FeedbackStatsDto` - agregowane statystyki
- `isLoading: boolean` - podczas pobierania danych
- `error: Error | null` - obsługa błędów
- `sortConfig: { field: string; direction: 'asc' | 'desc' }` - konfiguracja sortowania

**Funkcje:**
- `handleFilterChange(filters: FeedbackFilters)` - zmiana filtrów, fetch nowych danych
- `handlePageChange(page: number)` - zmiana strony, fetch nowych danych
- `handleSort(field: string, direction)` - zmiana sortowania, fetch nowych danych
- `handleExport()` - eksport danych do CSV

### Custom Hook: `useFeedbacksAdmin`

```typescript
interface UseFeedbacksAdminReturn {
  stats: FeedbackStatsDto | null;
  feedbacks: FeedbackRow[];
  pagination: PaginationInfo | null;
  filters: FeedbackFilters;
  isLoading: boolean;
  error: Error | null;
  setFilters: (filters: FeedbackFilters) => void;
  setPage: (page: number) => void;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  refetch: () => void;
  exportToCSV: (filename?: string) => void;
}

export function useFeedbacksAdmin(initialFilters?: FeedbackFilters): UseFeedbacksAdminReturn {
  // implementacja...
}
```

## 7. Integracja API

### Endpoints wymagane

#### `GET /api/feedbacks/stats`

**Query Parameters:**
- `startDate` (string, optional): YYYY-MM-DD
- `endDate` (string, optional): YYYY-MM-DD
- Zwraca: `{ averageRating: number; totalFeedbacks: number }`

#### `GET /api/admin/feedbacks`

**Wymagane uprawnienia:** Rola `admin`

**Query Parameters:**
- `page` (number, optional): Numer strony (default: 1)
- `limit` (number, optional): Liczba feedbacków na stronę (default: 20, max: 100)
- `sortBy` (string, optional): 'date' | 'rating'
- `sortOrder` (string, optional): 'asc' | 'desc'
- `minRating` (number, optional): 1-5
- `maxRating` (number, optional): 1-5
- `startDate` (string, optional): YYYY-MM-DD
- `endDate` (string, optional): YYYY-MM-DD

**Response (200 OK):**
```typescript
{
  data: [
    {
      id: 1,
      rating: 5,
      comment: "Świetna aplikacja!",
      createdAt: "2025-11-10T10:00:00Z",
      userId: "user-uuid-1"
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Brak autentykacji
- `403 Forbidden`: Brak roli `admin`
- `400 Bad Request`: Nieprawidłowe parametry

#### `DELETE /api/admin/feedbacks/{id}` (opcjonalnie dla MVP+)

**Wymagane uprawnienia:** Rola `admin`

**Response (204 No Content)**

**Error Responses:**
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

## 8. Interakcje użytkownika

1. **Otwarcie strony:**
   - Administrator wchodzi na `/admin/feedbacks`
   - Middleware sprawdza rolę - jeśli nie admin, redirect na `/dashboard`
   - Strona ładuje statystyki i listę feedbacków
   - Wyświetlane są: metryki, wykres rozkładu ocen, tabela feedbacków

2. **Filtrowanie po dacie:**
   - Administrator ustawia datę "Od" i "Do" w FilterControls
   - Klika "Zastosuj"
   - API fetch z nowymi parametrami datwy
   - Tabela odświeża się, wykres może się zmienić (jeśli design zawiera zmianę zakresu dla wykresu)

3. **Filtrowanie po rating:**
   - Administrator wybiera rating z Select (np. "5 gwiazdek")
   - Klika "Zastosuj"
   - API fetch z parametrem `minRating=5`
   - Tabela odświeża się

4. **Sortowanie:**
   - Administrator klika na nagłówek kolumny (np. "Data")
   - Tabela sortuje się rosnąco/malejąco
   - Ikona sortowania pojawia się w nagłówku

5. **Paginacja:**
   - Administrator klika "Next" lub przychodzi bezpośrednio na stronę 2+
   - API fetch z parametrem `page=2`
   - Tabela wyświetla feedbacki z strony 2

6. **Eksport danych:**
   - Administrator klika przycisk "Eksportuj"
   - Widzi dropdown menu z opcjami CSV
   - Klika CSV
   - Plik CSV zostaje pobrany z danych aktualnie wyświetlanych na stronie

7. **Czyszczenie filtrów:**
   - Administrator klika "Wyczyść"
   - Wszystkie filtry resetują się
   - Tabela wyświetla domyślne dane (strona 1, bez filtrów)

## 9. Warunki i walidacja

### Walidacja filtrów

- **Data "Od":**
  - Format: YYYY-MM-DD
  - Nie może być po dacie "Do"
  - Nie może być w przyszłości
- **Data "Do":**
  - Format: YYYY-MM-DD
  - Nie może być przed datą "Od"
  - Domyślnie: dzisiaj
- **Rating:**
  - Wartości: 1, 2, 3, 4, 5 lub "All"
  - Przesyłane jako minRating/maxRating lub opcja wyboru

### Walidacja danych z API

- **Rating:** Must be integer 1-5
- **Comment:** Max 1000 characters, can be empty
- **CreatedAt:** Valid ISO string date

### Paginacja

- **Page:** Must be >= 1
- **Limit:** Between 1 and 100, default 20
- **Total:** Server zwraca totalPages

## 10. Obsługa błędów

### Błędy walidacji filtrów (frontend)

- **Data "Od" po dacie "Do":**
  - Wyświetlenie: Toast notification "Data 'Od' nie może być po dacie 'Do'"
  - Kolor: Żółty (warning)
  - Akcja: Disable przycisku "Zastosuj" do czasu naprawy

- **Rating poza zakresem:**
  - Wyświetlenie: Komunikat validation "Rating musi być między 1-5"
  - Automatyczne resetowanie na Select

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

- **Brak feedbacków:**
  - Wyświetlenie: EmptyState z komunikatem "Brak feedbacków dla wybranych filtrów"
  - Przycisk "Wyczyść filtry"

- **Bardzo duża liczba feedbacków (>1000):**
  - Paginacja zapewnia sensowne pobieranie danych
  - Limit 100 per page maksymalnie

- **Lata z dużą ilością danych (eksport CSV):**
  - CSV jest generowany post-stronie serwera
  - Nie blokuje UI podczas eksportu

## 11. Kroki implementacji

### Etap 1: Przygotowanie struktury i typów

1. **Utwórz folder admin:**
   - `src/pages/profile/admin/` - folder na admin pages
   - `src/layouts/AdminLayout.astro` - dedykowany layout

2. **Definiuj typy w `src/types.ts`:**
   - FeedbackRow
   - FeedbackStatsDto
   - FeedbackFilters
   - AdminHeaderProps
   - AdminSidebarProps
   - MetricsCardProps
   - RatingDistributionChartProps

3. **Utwórz Zod schematy w `src/types.ts`:**
   - FeedbackFiltersSchema

4. **Aktualizuj middleware `src/middleware/index.ts`:**
   - Dodaj sprawdzenie roli `admin` dla tras `/profile/admin/*`
   - Redirect jeśli nie admin na `/profile` z komunikatem błędu

### Etap 2: Implementacja komponentów Astro

5. **Utwórz `src/layouts/AdminLayout.astro`:**
   - Layout z header, sidebar, main content area
   - Sprawdzenie autentykacji i roli admin w Server Component
   - Redirect jeśli nie admin

6. **Utwórz `src/pages/profile/admin/feedbacks.astro`:**
    - Użycie AdminLayout
    - Pobieranie danych z API endpoints (`GET /api/feedbacks/stats`, `GET /api/admin/feedbacks`)
    - Passing danych do React komponentów
    - Obsługa błędów

### Etap 3: Implementacja komponentów React

7. **Utwórz `src/components/admin/AdminHeader.tsx`:**
   - Wyświetlanie email użytkownika
   - Przycisk wylogowania
   - ThemeToggle

8. **Utwórz `src/components/admin/AdminSidebar.tsx`:**
   - Nawigacja do `/admin/feedbacks` i `/admin/ai-stats`
   - Active state na bieżącej stronie
   - Link powrotu na `/dashboard`

9. **Utwórz `src/components/MetricsCard.tsx`:**
   - Card z wartością, tytułem, opcjonalnym trendem
   - Obsługa różnych wariantów (success, warning, danger)

10. **Utwórz `src/components/MetricsGrid.tsx`:**
    - Responsive grid kontener

11. **Utwórz `src/components/admin/RatingDistributionChart.tsx`:**
    - Bar chart z Recharts
    - Responsive container
    - Loading skeleton

12. **Utwórz `src/components/admin/FilterControls.tsx`:**
    - DatePicker dla startDate/endDate
    - Select dla rating
    - Przyciski "Zastosuj" i "Wyczyść"
    - Walidacja na frontend

13. **Utwórz `src/components/admin/AdminTable.tsx`:**
    - Tabela z Shadcn/ui Table
    - Kolumny: Data, Rating (gwiazdki), Komentarz, ID User
    - Sortowanie po kliknięciu nagłówka
    - Hover effects

14. **Utwórz `src/components/admin/ExportButton.tsx`:**
    - Przycisk eksportu
    - Dropdown menu CSV/JSON
    - Funkcja generacji CSV

15. **Utwórz custom hook `src/components/hooks/useFeedbacksAdmin.ts`:**
    - Zarządzanie stanem filtrów, danych, paginacji
    - Fetch z API
    - Obsługa błędów

16. **Utwórz `src/components/admin/FeedbacksView.tsx`:**
    - Główny komponent zintegrowany dla widoku feedbacków
    - Używa `useFeedbacksAdmin` hook
    - Renderuje MetricsGrid, RatingDistributionChart, FilterControls, AdminTable, Pagination

### Etap 4: Implementacja API (backend)

17. **Zaktualizuj middleware `src/middleware/index.ts`:**
    - Dodaj logikę sprawdzania roli `admin` dla tras `/profile/admin/*`
    - Pobranie user role z JWT lub Supabase
    - Redirect na `/profile` z komunikatem błędu jeśli użytkownik nie jest adminem

18. **Zaktualizuj lub utwórz service `src/lib/services/feedback.service.ts`:**
    - Funkcja `getFeedbacksStats(supabase, filters?)` - pobiera agregowane statystyki
    - Funkcja `getFeedbacksList(supabase, filters)` - pobiera listę feedbacków z paginacją
    - Funkcja `deleteFeedback(supabase, feedbackId)` (opcjonalnie)

19. **Utwórz/zaktualizuj endpoint `src/pages/api/admin/feedbacks.ts`:**
    - Handler GET
    - Sprawdzenie roli admin (middleware + RLS)
    - Walidacja query parameters
    - Pobieranie danych za pośrednictwem service
    - Error handling

20. **Sprawdź istniejący endpoint `src/pages/api/feedbacks/stats.ts`:**
    - Powinien być dostępny publicznie (dla insights ogólnych)
    - Jeśli nie istnieje, utwórz go

### Etap 5: Styling i accessibility

21. **Stylowanie Tailwind:**
    - Używaj `@layer` dla consistency
    - Ciemny tryb (dark: variant)
    - Responsive design (mobile-first)
    - Focus states dla accessibility
    - Loading states (skeleton, spinner)
    - Empty states

22. **Accessibility (ARIA):**
    - `aria-label` dla przycisków bez tekstu
    - `aria-describedby` dla pól input
    - `role="table"` dla tabel (jeśli custom table)
    - `aria-sort` dla sortowania kolumn
    - `aria-current="page"` dla aktywnego link w sidebar
    - Color contrast WCAG AA

### Etap 6: Testing i walidacja

23. **Testy jednostkowe:**
    - Unit test dla RatingDistributionChart (`src/components/admin/RatingDistributionChart.test.ts`)
    - Unit test dla FilterControls (`src/components/admin/FilterControls.test.ts`)
    - Unit test dla `useFeedbacksAdmin` hook

24. **Testy integracyjne:**
    - Integration test dla `/admin/feedbacks` strony (`src/pages/admin/feedbacks.test.ts`)
    - API test dla GET `/api/admin/feedbacks` (`src/pages/api/admin/feedbacks.test.ts`)

25. **Testowanie manualne:**
    - Poprawne pobieranie i wyświetlanie danych
    - Filtrowanie po dacie i rating
    - Sortowanie tabeli
    - Paginacja
    - Eksport do CSV
    - Accessibility (keyboard navigation, screen reader)
    - Responsive design (mobile, tablet, desktop)
    - Error handling (network error, auth error)

### Etap 7: Opracowanie dokumentacji

26. **Dokumentacja kodu:**
    - JSDoc komentarze dla funkcji
    - Inline komentarze dla złożonej logiki
    - README dla folder `/admin`

27. **Code review:**
    - Spełniają się wymagania
    - Kod czysty i czytelny (linting, formatting)
    - Error handling kompletny
    - Security (RLS, auth checks)
    - Performance (no unnecessary re-renders, lazy loading)
    - Accessibility WCAG 2.1 AA

