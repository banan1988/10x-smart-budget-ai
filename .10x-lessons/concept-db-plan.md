# Planowanie Bazy Danych - SmartBudgetAI MVP

## Podsumowanie Rozmowy

Na podstawie analizy PRD i tech stacku (Supabase z PostgreSQL), przeprowadzono iteracyjny proces planowania schematu bazy danych dla MVP aplikacji SmartBudgetAI. Głównymi wymaganiami schematu są: obsługa autoryzacji użytkowników przez Supabase Auth, przechowywanie transakcji finansowych z automatyczną kategoryzacją AI, oraz zapewnienie bezpieczeństwa danych wrażliwych.

## Decyzje Podjęte

1. Relacja między użytkownikami a transakcjami będzie one-to-many z kaskadowym usuwaniem dla zgodności z RODO.
2. Kategorie będą globalne i niezmienne dla wszystkich użytkowników w MVP.
3. Pole amount w transakcjach będzie typu INTEGER (grosze) z constraint CHECK(amount > 0).
4. Tabela transactions będzie miała indeks złożony na (user_id, date) oraz dodatkowy indeks na category_id.
5. Tabela categories będzie miała indeks na name dla optymalizacji pobierania listy kategorii.
6. Row Level Security (RLS) będzie włączone dla transactions z polityką user_id = auth.uid() dla wszystkich operacji.
7. Kategorie nie będą dostępne publicznie bez autoryzacji - nawet AI będzie potrzebować klucza API do pobrania listy.
8. Partycjonowanie tabeli transactions nie będzie implementowane w MVP.
9. Pole śledzące kategoryzację AI zostanie nazwane `is_ai_categorized` typu BOOLEAN z domyślną wartością false.
10. Tabela transactions będzie miała pola created_at i updated_at typu TIMESTAMPTZ.
11. Tabela users będzie zawierać minimalne pola: id (UUID), email, encrypted_password, created_at, opcjonalnie nickname (VARCHAR bez limitu).
12. Preferencje użytkownika będą przechowywane w kolumnie JSONB w tabeli users dla elastyczności i łatwości dodawania nowych preferencji.
13. Tabela categories będzie miała strukturę: id (UUID PRIMARY KEY), name (UNIQUE), created_at (TIMESTAMPTZ).
14. Walidacja długości pól (np. description) będzie przeniesiona do warstwy biznesowej aplikacji, nie bazy danych.
15. Foreign key między transactions.category_id a categories.id będzie miał ON DELETE RESTRICT.
16. Cache'owanie kategorii zostanie pominięte w MVP.
17. Wszystkie tabele będą miały automatyczne triggery do aktualizacji pola updated_at.
18. PostgreSQL będzie odpowiedzialny za automatyczne tworzenie indeksów na foreign keys.

## Kluczowe Encje i Relacje

### Tabele

**users**
- id (UUID PRIMARY KEY)
- email (UNIQUE)
- encrypted_password
- nickname (opcjonalne)
- preferences (JSONB DEFAULT '{}')
- created_at (TIMESTAMPTZ)

**transactions**
- id (UUID PRIMARY KEY)
- user_id (UUID FOREIGN KEY -> users.id)
- category_id (UUID FOREIGN KEY -> categories.id)
- amount (INTEGER - grosze, CHECK > 0)
- description (TEXT)
- date (DATE)
- is_ai_categorized (BOOLEAN DEFAULT false)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

**categories**
- id (UUID PRIMARY KEY)
- name (UNIQUE)
- created_at (TIMESTAMPTZ)


### Relacje
- users (1) -> transactions (many)
- transactions (many) -> categories (1)

## Bezpieczeństwo i Skalowalność

### Row Level Security (RLS)
- **transactions**: SELECT/INSERT/UPDATE/DELETE WHERE user_id = auth.uid()
- **users**: SELECT/UPDATE WHERE id = auth.uid() (preferencje są częścią tabeli users)
- **categories**: SELECT z autoryzacją API, INSERT/UPDATE/DELETE tylko dla adminów

### Indeksy
- Indeks złożony na (user_id, date DESC) dla optymalizacji zapytań dashboard
- Indeks na category_id dla łączenia z kategoriami
- Indeks na name w categories dla pobierania listy przez AI
- Indeks GIN na preferences w users dla wydajności zapytań JSONB
- Indeksy na foreign keys (automatyczne przez PostgreSQL)

### Skalowalność
- Struktura kompatybilna z przyszłym partycjonowaniem po miesiącach
- Brak cache'owania w MVP - do dodania w kolejnych iteracjach
- Pola timestamp dla audytu i debugowania

## Najistotniejsze Zalecenia

1. Relacja one-to-many między users i transactions z kaskadowym usuwaniem dla integralności danych.
2. Globalne, niezmienne kategorie z indeksem na name dla wydajności pobierania listy przez AI.
3. Constraint CHECK(amount > 0) dla zapewnienia poprawności danych finansowych.
4. Indeks złożony (user_id, date) dla optymalizacji zapytań dashboard po miesiącach.
5. RLS z polityką user_id = auth.uid() dla pełnej izolacji danych użytkowników.
6. Unikalny constraint na categories.name dla zapobiegania duplikatom nazw kategorii.
7. Kolumna JSONB preferences w tabeli users dla elastycznego rozszerzania ustawień bez migracji schematu.
8. Pole is_ai_categorized dla śledzenia poprawek kategoryzacji przez użytkowników.
9. Automatyczne triggery na updated_at dla wszystkich tabel do celów audytu.
10. ON DELETE RESTRICT dla kategorii, aby zapobiec przypadkowemu usunięciu używanych kategorii.

## Nierozwiązane Kwestie

Potrzebna weryfikacja czy PRD wymaga aktualizacji na podstawie ustalonych decyzji (np. zmiana nazwy pola is_ai_categorized, wymagania bezpieczeństwa dla dostępu do kategorii, preferencje użytkownika w JSONB). Brak innych nierozwiązanych kwestii - schemat wydaje się kompletny dla MVP.

## Przykład Struktury Preferencji JSONB

```json
{
  "dark_mode": false,
  "language": "pl",
  "currency": "PLN",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

### Migracja Preferencji dla Istniejących Użytkowników

```sql
-- Dodanie nowej preferencji dla wszystkich użytkowników
UPDATE users 
SET preferences = preferences || '{"new_preference": "default_value"}' 
WHERE preferences->>'new_preference' IS NULL;
```
