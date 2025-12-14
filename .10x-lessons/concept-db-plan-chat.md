<conversation_summary>
<decisions>
Relacja między użytkownikami a transakcjami będzie one-to-many z kaskadowym usuwaniem dla zgodności z RODO.
Kategorie będą globalne i niezmienne dla wszystkich użytkowników w MVP.
Pole amount w transakcjach będzie typu INTEGER (grosze) z constraint CHECK(amount > 0).
Tabela transactions będzie miała indeks złożony na (user_id, date) oraz dodatkowy indeks na category_id.
Tabela categories będzie miała indeks na name dla optymalizacji pobierania listy kategorii.
Row Level Security (RLS) będzie włączone dla transactions z polityką user_id = auth.uid() dla wszystkich operacji.
Kategorie nie będą dostępne publicznie bez autoryzacji - nawet AI będzie potrzebować klucza API do pobrania listy.
Partycjonowanie tabeli transactions nie będzie implementowane w MVP.
Pole śledzące kategoryzację AI zostanie nazwane is_ai_categorized typu BOOLEAN z domyślną wartością false.
Tabela transactions będzie miała pola created_at i updated_at typu TIMESTAMPTZ.
Tabela users będzie zawierać minimalne pola: id (UUID), email, encrypted_password, created_at, opcjonalnie nickname (VARCHAR bez limitu).
Preferencje użytkownika będą przechowywane w kolumnie JSONB w tabeli users dla elastyczności i łatwości dodawania nowych preferencji.
Tabela categories będzie miała strukturę: id (UUID PRIMARY KEY), name (UNIQUE), created_at (TIMESTAMPTZ).
Walidacja długości pól (np. description) będzie przeniesiona do warstwy biznesowej aplikacji, nie bazy danych.
Foreign key między transactions.category_id a categories.id będzie miał ON DELETE RESTRICT.
Cache'owanie kategorii zostanie pominięte w MVP.
Wszystkie tabele będą miały automatyczne triggery do aktualizacji pola updated_at.
PostgreSQL będzie odpowiedzialny za automatyczne tworzenie indeksów na foreign keys.
</decisions>
<matched_recommendations>
Relacja one-to-many między users i transactions z kaskadowym usuwaniem dla integralności danych.
Globalne, niezmienne kategorie z indeksem na name dla wydajności pobierania listy przez AI.
Constraint CHECK(amount > 0) dla zapewnienia poprawności danych finansowych.
Indeks złożony (user_id, date) dla optymalizacji zapytań dashboard po miesiącach.
RLS z polityką user_id = auth.uid() dla pełnej izolacji danych użytkowników.
Unikalny constraint na categories.name dla zapobiegania duplikatom nazw kategorii.
Kolumna JSONB preferences w tabeli users dla elastycznego rozszerzania ustawień bez migracji schematu.
Pole is_ai_categorized dla śledzenia poprawek kategoryzacji przez użytkowników.
Automatyczne triggery na updated_at dla wszystkich tabel do celów audytu.
ON DELETE RESTRICT dla kategorii, aby zapobiec przypadkowemu usunięciu używanych kategorii.
</matched_recommendations>
<database_planning_summary>
Na podstawie analizy PRD i tech stacku (Supabase z PostgreSQL), przeprowadzono iteracyjny proces planowania schematu bazy danych dla MVP aplikacji SmartBudgetAI. Głównymi wymaganiami schematu są: obsługa autoryzacji użytkowników przez Supabase Auth, przechowywanie transakcji finansowych z automatyczną kategoryzacją AI, oraz zapewnienie bezpieczeństwa danych wrażliwych.
Kluczowe encje to:
users: Minimalna tabela z polami id, email, encrypted_password, created_at, nickname (opcjonalne), preferences (JSONB)
transactions: Zawiera user_id, category_id, amount (INTEGER grosze), description (TEXT), date, is_ai_categorized (BOOLEAN), created_at, updated_at
categories: Globalna tabela z id (UUID PK), name (UNIQUE), created_at
Relacje: users (1) -> transactions (many), transactions (many) -> categories (1).
Bezpieczeństwo realizowane przez RLS - transactions izolowane per użytkownik, users z dostępem tylko do własnych danych (w tym preferences), categories dostępne tylko z autoryzacją API. Skalowalność zapewniona przez odpowiednie indeksy (złożony na user_id+date, indeksy na foreign keys, indeks GIN na preferences), brak partycjonowania w MVP ale struktura kompatybilna z przyszłym dodaniem. Wszystkie tabele mają pola timestamp dla audytu, triggery automatyczne.
</database_planning_summary>
<unresolved_issues>
Potrzebna weryfikacja czy PRD wymaga aktualizacji na podstawie ustalonych decyzji (np. zmiana nazwy pola is_ai_categorized, wymagania bezpieczeństwa dla dostępu do kategorii, preferencje użytkownika w JSONB). Brak innych nierozwiązanych kwestii - schemat wydaje się kompletny dla MVP.
</unresolved_issues>
</conversation_summary>
