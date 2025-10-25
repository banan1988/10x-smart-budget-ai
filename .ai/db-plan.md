# Schemat Bazy Danych: SmartBudgetAI (MVP)

## 1. Lista Tabel z Kolumnami, Typami Danych i Ograniczeniami

### Tabela: users (auth.users)

Ta tabela jest w pełni zarządzana przez Supabase Auth i nie można jej bezpośrednio modyfikować.

- **id**: UUID PRIMARY KEY (zarządzane przez Supabase Auth)
- **email**: VARCHAR NOT NULL (zarządzane przez Supabase Auth)
- **encrypted_password**: VARCHAR NOT NULL (zarządzane przez Supabase Auth)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW() (zarządzane przez Supabase Auth)

### Tabela: user_profiles

Tabela rozszerzająca dane użytkownika z relacją 1:1 do auth.users.

- **id**: UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
- **nickname**: VARCHAR (opcjonalne, bez limitu długości)
- **preferences**: JSONB DEFAULT '{}'::jsonb NOT NULL (elastyczne ustawienia użytkownika, domyślnie pusty obiekt JSON)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### Tabela: categories
- **id**: BIGSERIAL PRIMARY KEY
- **key**: VARCHAR UNIQUE NOT NULL (klucz kategorii dla AI, np. 'food', 'transport')
- **translations**: JSONB NOT NULL (tłumaczenia nazw kategorii, np. {"pl": "Jedzenie", "en": "Food"})
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

### Tabela: transactions
- **id**: BIGSERIAL PRIMARY KEY
- **user_id**: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- **category_id**: BIGSERIAL REFERENCES categories(id) ON DELETE RESTRICT
- **amount**: INTEGER NOT NULL CHECK(amount > 0)
- **description**: TEXT NOT NULL
- **date**: DATE NOT NULL
- **is_ai_categorized**: BOOLEAN NOT NULL DEFAULT FALSE
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW()

## 2. Relacje Między Tabelami

- **auth.users (1) -> user_profiles (1)**: Relacja jeden-do-jednego z kaskadowym usuwaniem (ON DELETE CASCADE). Każdy użytkownik może mieć jeden profil, który jest automatycznie usuwany po usunięciu konta użytkownika. Klucz podstawowy user_profiles.id jest jednocześnie kluczem obcym do auth.users(id).
- **auth.users (1) -> transactions (many)**: Relacja jeden-do-wielu z kaskadowym usuwaniem (ON DELETE CASCADE) dla zgodności z RODO. Każdy użytkownik może mieć wiele transakcji, a usunięcie użytkownika usuwa wszystkie jego transakcje.
- **transactions (many) -> categories (1)**: Relacja wiele-do-jednego. Każda transakcja należy do jednej kategorii, ale kategorie są globalne i współdzielone przez wszystkich użytkowników. Foreign key z ON DELETE RESTRICT zapobiega usunięciu kategorii, jeśli jest używana w transakcjach.

## 3. Indeksy

- **user_profiles**: Indeks GIN na preferences dla zapytań JSONB (wydajne wyszukiwanie w ustawieniach użytkownika).
- **user_profiles**: Klucz podstawowy id jest automatycznym indeksem (relacja 1:1 z auth.users).
- **transactions**: Indeks złożony na (user_id, date) dla optymalizacji zapytań dashboard po miesiącach.
- **transactions**: Indeks na category_id dla wydajności zapytań związanych z kategoriami.
- **categories**: Indeks na key dla optymalizacji pobierania listy kategorii przez AI.
- PostgreSQL automatycznie tworzy indeksy na kluczach obcych (user_id, category_id).

## 4. Zasady PostgreSQL (RLS - Row Level Security)

- **user_profiles**: RLS włączone z polityką id = auth.uid() dla wszystkich operacji (SELECT, INSERT, UPDATE, DELETE). Użytkownik ma dostęp tylko do własnego profilu.
- **transactions**: RLS włączone z polityką user_id = auth.uid() dla wszystkich operacji (SELECT, INSERT, UPDATE, DELETE). Zapewnia izolację danych użytkowników - każdy użytkownik widzi tylko swoje transakcje.
- **auth.users**: Dostęp zarządzany przez Supabase Auth - użytkownik ma dostęp tylko do własnych danych autentykacyjnych.
- **categories**: Dostęp tylko z autoryzacją API (nie publiczny), nawet dla AI wymagany klucz API.

## 5. Dodatkowe Uwagi lub Wyjaśnienia Dotyczące Decyzji Projektowych

- **Normalizacja**: Schemat jest w 3NF. Tabele są podzielone logicznie, bez redundancji danych.
- **Rozszerzenie Tabeli Users**: Ponieważ tabela `auth.users` jest w pełni zarządzana przez Supabase Auth, utworzono osobną tabelę `user_profiles` w relacji 1:1, która przechowuje dodatkowe dane użytkownika (nickname, preferences). Klucz podstawowy `user_profiles.id` jest jednocześnie kluczem obcym do `auth.users(id)`, co zapewnia spójność danych i automatyczne usuwanie profilu przy usunięciu konta.
- **Typy Danych**: amount jako INTEGER (grosze) dla precyzji finansowej, unikając problemów z float. description jako TEXT dla elastyczności długości.
- **Bezpieczeństwo**: RLS zapewnia prywatność danych. Każdy użytkownik ma dostęp tylko do własnego profilu i transakcji. Kategorie globalne, ale chronione przed publicznym dostępem.
- **Wydajność**: Indeksy zoptymalizowane pod zapytania dashboard i AI. Indeks GIN na preferences umożliwia wydajne zapytania JSONB. Brak partycjonowania w MVP, ale struktura kompatybilna z przyszłym dodaniem.
- **Trigery**: 
  - Tabela `user_profiles` ma automatyczny trigger do aktualizacji `updated_at` przy zmianach.
  - Tabela `transactions` ma automatyczny trigger do aktualizacji `updated_at` przy zmianach.
  - Opcjonalnie: trigger tworzący pusty profil w `user_profiles` automatycznie przy rejestracji nowego użytkownika w `auth.users` (można zaimplementować jako PostgreSQL trigger lub w logice aplikacji).
- **Walidacja**: Długość pól (np. description, nickname) walidowana w aplikacji, nie w DB, dla lepszej elastyczności.
- **Zgodność z PRD**: Schemat obsługuje wszystkie wymagane funkcjonalności MVP, w tym CRUD transakcji, kategoryzację AI, dashboard i zbieranie opinii (przechowywane w preferences JSONB w tabeli user_profiles).
- **Stack Technologiczny**: Zoptymalizowany dla Supabase/PostgreSQL z integracją Supabase Auth.
- **Wielojęzyczność Kategorii**: 
  - Pole `key` przechowuje unikalny identyfikator kategorii w języku angielskim (np. 'food', 'transport'), który jest używany przez AI do kategoryzacji.
  - Pole `translations` jako JSONB przechowuje tłumaczenia nazw kategorii w różnych językach (np. {"pl": "Jedzenie", "en": "Food", "de": "Essen"}).
  - W MVP obsługiwany jest tylko język polski, ale struktura pozwala na łatwe dodanie nowych języków bez zmian w schemacie bazy danych.
  - AI operuje na kluczu `key`, a interfejs użytkownika wyświetla nazwę z `translations` na podstawie wybranego języka.
  - Przykładowa kategoria: `{id: 1, key: "food", translations: {"pl": "Jedzenie", "en": "Food"}}`.
  - Frontend pobiera preferowany język z ustawień użytkownika (preferences JSONB w tabeli user_profiles) lub z nagłówka Accept-Language.
