# Plan implementacji widoku Transakcje

## 1. Przegląd
Celem tego dokumentu jest szczegółowe zaplanowanie implementacji widoku listy transakcji. Widok ten umożliwi użytkownikom przeglądanie, filtrowanie i zarządzanie swoimi transakcjami finansowymi. Zapewni responsywny interfejs, który dostosowuje się do różnych rozmiarów ekranu, wyświetlając dane w formie tabeli na desktopie i listy kart na urządzeniach mobilnych.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/transactions`. Dostęp do tej ścieżki będzie chroniony przez middleware, zapewniając, że tylko zalogowani użytkownicy mogą przeglądać swoje transakcje.

## 3. Struktura komponentów
Widok `TransactionsPage` będzie renderowany przez Astro i będzie zawierał komponenty React do obsługi dynamicznych części interfejsu.

```
/src/pages/transactions.astro (TransactionsPage)
└── /src/components/TransactionsView.tsx (client:load)
    ├── /src/components/TransactionsFilters.tsx
    │   ├── <Input> (shadcn/ui) - Wyszukiwanie
    │   ├── <Select> (shadcn/ui) - Filtr typu transakcji
    │   └── <Popover> (shadcn/ui) z <Command> - Filtr kategorii
    ├── /src/components/TransactionsTable.tsx (dla desktopu)
    │   ├── <Table> (shadcn/ui)
    │   └── <TransactionsTableRow>
    │       └── <DropdownMenu> (shadcn/ui) - Akcje (Edytuj, Usuń)
    ├── /src/components/TransactionsList.tsx (dla mobile)
    │   ├── <Card> (shadcn/ui)
    │   └── <TransactionsCardItem>
    │       └── <DropdownMenu> (shadcn/ui) - Akcje (Edytuj, Usuń)
    ├── <Pagination> (shadcn/ui)
    ├── <AddTransactionDialog> (komponent współdzielony)
    └── <AlertDialog> (shadcn/ui) - Potwierdzenie usunięcia
```

## 4. Szczegóły komponentów

### `TransactionsView` (React)
- **Opis:** Główny komponent React, który zarządza stanem całego widoku, w tym filtrami, paginacją i danymi transakcji. Pobiera dane z API i przekazuje je do komponentów podrzędnych.
- **Główne elementy:** `TransactionsFilters`, `TransactionsTable`, `TransactionsList`, `Pagination`.
- **Obsługiwane interakcje:** Zmiana filtrów, zmiana strony, otwarcie dialogu dodawania/edycji transakcji, usunięcie transakcji.
- **Typy:** `TransactionVM`, `Pagination`, `TransactionFilters`.
- **Propsy:** Brak.

### `TransactionsFilters` (React)
- **Opis:** Komponent zawierający wszystkie filtry dla listy transakcji.
- **Główne elementy:** `Input` (wyszukiwanie), `Select` (typ), `Popover` z `Command` (kategorie).
- **Obsługiwane interakcje:** Wprowadzanie tekstu w polu wyszukiwania, wybór typu transakcji, wybór kategorii.
- **Warunki walidacji:** Brak, wszystkie wartości są opcjonalne.
- **Typy:** `TransactionFilters`.
- **Propsy:**
    - `filters: TransactionFilters`
    - `onFiltersChange: (filters: TransactionFilters) => void`
    - `categories: Category[]`

### `TransactionsTable` (React)
- **Opis:** Wyświetla transakcje w formie tabeli na większych ekranach.
- **Główne elementy:** `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` z `shadcn/ui`. Każdy wiersz reprezentuje jedną transakcję.
- **Obsługiwane interakcje:** Otwarcie menu akcji (`DropdownMenu`).
- **Typy:** `TransactionVM[]`.
- **Propsy:**
    - `transactions: TransactionVM[]`
    - `onEdit: (transaction: TransactionVM) => void`
    - `onDelete: (transactionId: number) => void`

### `TransactionsList` (React)
- **Opis:** Wyświetla transakcje w formie listy kart na mniejszych ekranach.
- **Główne elementy:** `Card` z `shadcn/ui`. Każda karta reprezentuje jedną transakcję.
- **Obsługiwane interakcje:** Otwarcie menu akcji (`DropdownMenu`).
- **Typy:** `TransactionVM[]`.
- **Propsy:**
    - `transactions: TransactionVM[]`
    - `onEdit: (transaction: TransactionVM) => void`
    - `onDelete: (transactionId: number) => void`

## 5. Typy

### `TransactionVM` (ViewModel)
Model widoku dla transakcji, dostosowany do wyświetlania w interfejsie użytkownika.
```typescript
interface TransactionVM {
  id: number;
  type: 'income' | 'expense';
  amount: string; // Sformatowana kwota z walutą, np. "50,00 zł"
  description: string;
  date: string; // Sformatowana data, np. "15 października 2025"
  categoryName: string;
  categoryKey: string;
  isAiCategorized: boolean;
}
```

### `TransactionFilters`
Obiekt przechowujący aktualny stan filtrów.
```typescript
interface TransactionFilters {
  month: string; // YYYY-MM
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  categoryId?: number[];
  search?: string;
}
```

## 6. Zarządzanie stanem
Stan będzie zarządzany w głównym komponencie `TransactionsView` przy użyciu hooków `useState` i `useEffect`. Rozważone zostanie stworzenie customowego hooka `useTransactions`, który hermetyzuje logikę pobierania danych, filtrowania i paginacji.

- **`useTransactions` hook:**
    - **Cel:** Zarządzanie całym stanem i logiką związaną z transakcjami.
    - **Zarządzany stan:**
        - `transactions: TransactionVM[]`
        - `pagination: Pagination | null`
        - `filters: TransactionFilters`
        - `isLoading: boolean`
        - `error: Error | null`
    - **Funkcje:**
        - `setFilters`: Aktualizuje filtry i ponownie pobiera dane.
        - `setPage`: Zmienia stronę i ponownie pobiera dane.
        - `refetch`: Wymusza ponowne pobranie danych.

## 7. Integracja API
Komponent `TransactionsView` (lub hook `useTransactions`) będzie komunikował się z endpointem `GET /api/transactions`.

- **Żądanie:** `GET /api/transactions`
- **Parametry zapytania:** `TransactionFilters`
- **Odpowiedź (sukces):**
  ```json
  {
    "data": Transaction[],
    "pagination": Pagination
  }
  ```
- **Odpowiedź (błąd):** `400 Bad Request`, `401 Unauthorized`.

Dane z API (`Transaction[]`) zostaną zmapowane na `TransactionVM[]` przed przekazaniem do komponentów widoku.

## 8. Interakcje użytkownika
- **Filtrowanie:** Użytkownik wprowadza tekst, wybiera typ lub kategorie. Powoduje to aktualizację stanu `filters` i ponowne wywołanie API.
- **Paginacja:** Użytkownik klika przyciski w komponencie `Pagination`. Powoduje to zmianę parametru `page` w `filters` i ponowne wywołanie API.
- **Dodawanie transakcji:** Użytkownik klika przycisk "Dodaj transakcję", co otwiera `AddTransactionDialog`. Po pomyślnym dodaniu transakcji, lista jest odświeżana.
- **Edycja transakcji:** Użytkownik wybiera "Edytuj" z `DropdownMenu`. Otwiera to `AddTransactionDialog` z wypełnionymi danymi. Po zapisaniu zmian, lista jest odświeżana.
- **Usuwanie transakcji:** Użytkownik wybiera "Usuń" z `DropdownMenu`. Otwiera się `AlertDialog` z prośbą o potwierdzenie. Po potwierdzeniu, wywoływane jest API do usunięcia transakcji, a lista jest odświeżana.

## 9. Warunki i walidacja
- **Filtr `month`:** Jest wymagany przez API. Domyślnie ustawiony na bieżący miesiąc. Interfejs powinien umożliwiać zmianę miesiąca.
- **Walidacja po stronie klienta:** Wszelkie formularze (np. `AddTransactionDialog`) powinny mieć walidację pól (np. kwota musi być liczbą dodatnią) przed wysłaniem do API.

## 10. Obsługa błędów
- **Błędy API:** Jeśli pobieranie danych się nie powiedzie, użytkownikowi zostanie wyświetlony komunikat o błędzie (np. za pomocą komponentu `Alert` z `shadcn/ui`).
- **Brak transakcji:** Jeśli API zwróci pustą listę transakcji, zostanie wyświetlony komunikat informujący o braku danych dla wybranych filtrów.
- **Błędy walidacji:** Błędy walidacji w formularzach będą wyświetlane pod odpowiednimi polami.

## 11. Kroki implementacji
1.  **Stworzenie strony Astro:** Utworzyć plik `/src/pages/transactions.astro`, który będzie renderował główny komponent React `TransactionsView` z dyrektywą `client:load`.
2.  **Implementacja `useTransactions` hook:** Stworzyć hook do zarządzania stanem, pobierania danych i obsługi filtrów.
3.  **Implementacja `TransactionsView`:** Zintegrować hook `useTransactions` i zbudować szkielet widoku.
4.  **Implementacja `TransactionsFilters`:** Stworzyć komponent filtrów i podłączyć go do hooka.
5.  **Implementacja `TransactionsTable` i `TransactionsList`:** Stworzyć komponenty do wyświetlania danych. Dodać logikę do warunkowego renderowania w zależności od szerokości ekranu (np. za pomocą hooka `useMediaQuery`).
6.  **Dodanie paginacji:** Zintegrować komponent `Pagination` z `shadcn/ui` i podłączyć go do hooka.
7.  **Integracja akcji:** Podłączyć akcje edycji i usuwania, w tym integrację z `AddTransactionDialog` i `AlertDialog`.
8.  **Obsługa responsywności:** Upewnić się, że przełączanie między `TransactionsTable` a `TransactionsList` działa poprawnie na różnych urządzeniach.
9.  **Obsługa błędów i stanów ładowania:** Dodać wskaźniki ładowania i komunikaty o błędach.
10. **Testowanie:** Napisać testy jednostkowe dla hooka `useTransactions` i testy komponentów w celu weryfikacji poprawnego renderowania i interakcji.

