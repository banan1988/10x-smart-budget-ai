# Wyłączenie RLS dla developmentu

## Opcja 1: Przez migrację SQL (Zalecana)

Utworzyłem migrację w pliku:
```
supabase/migrations/20251120000000_disable_rls_dev.sql
```

Aby zastosować migrację:

```bash
# Zresetuj lokalną bazę danych (zastosuje wszystkie migracje)
supabase db reset --local

# LUB jeśli reset nie działa, zastosuj migrację ręcznie
supabase db push --local
```

## Opcja 2: Przez Supabase Studio (Najszybsza)

1. Otwórz Supabase Studio w przeglądarce:
   ```
   http://localhost:54323
   ```

2. Przejdź do **SQL Editor**

3. Wklej i wykonaj następujący kod SQL:
   ```sql
   -- Wyłącz RLS na wszystkich tabelach
   ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
   ```

4. Kliknij **Run** lub naciśnij `Ctrl+Enter`

## Opcja 3: Przez psql (Jeśli masz zainstalowany PostgreSQL client)

```bash
# Połącz się z lokalną bazą Supabase
psql postgresql://postgres:postgres@localhost:54322/postgres

# Wykonaj komendy:
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;

# Wyjdź
\q
```

## Sprawdzenie czy RLS jest wyłączony

W SQL Editor wykonaj:
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public';
```

Kolumna `rowsecurity` powinna pokazywać `false` dla wszystkich tabel.

## ⚠️ WAŻNE: Włączenie RLS przed deployment na produkcję

Przed wdrożeniem na produkcję **MUSISZ** włączyć RLS:

```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
```

## Po wyłączeniu RLS

Teraz powinieneś móc dodawać transakcje bez błędu RLS. Aplikacja będzie działać z `DEFAULT_USER_ID` zdefiniowanym w `src/db/constants.ts`.

## Testowanie

Po wyłączeniu RLS, spróbuj dodać transakcję przez interfejs:
1. Otwórz http://localhost:4321/transactions
2. Kliknij "Dodaj transakcję"
3. Wypełnij formularz i zapisz
4. Transakcja powinna zostać dodana bez błędu RLS

