# Architektura UI dla SmartBudgetAI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla SmartBudgetAI została zaprojektowana w celu zapewnienia nowoczesnego, responsywnego i dostępnego doświadczenia użytkownika. Aplikacja będzie zbudowana przy użyciu Astro dla stron statycznych i layoutów oraz React dla komponentów interaktywnych. Biblioteka komponentów Shadcn/ui posłuży jako fundament dla spójnego wyglądu i działania, a Tailwind CSS zapewni elastyczność w stylizacji.

Struktura opiera się na kilku kluczowych widokach: stronie głównej (marketingowy Landing Page), stronach logowania i rejestracji, pulpicie nawigacyjnym, liście transakcji oraz stronie ustawień. Nawigacja między tymi widokami będzie prosta i intuicyjna. Zarządzanie stanem globalnym (np. sesją użytkownika) zostanie zrealizowane za pomocą `nanostores`, a komunikacja z API będzie asynchroniczna, z wykorzystaniem komponentów `Toast` do obsługi błędów i `Skeleton` do sygnalizowania stanów ładowania. Bezpieczeństwo tras będzie zapewnione przez middleware w Astro, który m.in. przekieruje zalogowanego użytkownika ze strony głównej na `/dashboard`.

## 2. Lista widoków

### Strona Główna (Landing Page)
- **Ścieżka widoku:** `/`
- **Główny cel:** Pierwsze wrażenie i konwersja. Zaprezentowanie wartości aplikacji: automatyczne kategoryzowanie wydatków dzięki AI, przejrzyste wykresy i raporty, pełna kontrola nad finansami.
- **Kluczowe sekcje i informacje:**
  - Sekcja Hero z hasłem (np. "Automatyczna kontrola nad Twoimi finansami dzięki AI") + podtytuł z wartością ("Oszczędzaj czas. Widzisz to, co ważne.").
  - Przyciski CTA: "Zarejestruj się za darmo" (primary), "Zaloguj się" (secondary outline).
  - Sekcja Funkcje (3–6 kart): AI kategoryzacja, szybkie dodawanie transakcji, inteligentne podsumowania, bezpieczeństwo danych.
  - Sekcja Wykres podglądowy: statyczny screenshot (optymalizowany przez Astro Image) lub lekka animacja mocku wykresu (bez prawdziwych danych użytkownika) pokazująca wizualny dashboard.
  - Sekcja Opinie (opcjonalnie): karuzela z cytatami użytkowników / placeholder.
  - Sekcja "Jak to działa" (3 kroki): 1. Dodajesz transakcję, 2. AI przypisuje kategorię, 3. Otrzymujesz czytelne podsumowania.
  - Sekcja FAQ (krótkie 4–6 pytań) – wspiera SEO + redukuje bariery decyzyjne.
  - Sekcja Final CTA powtarzająca najważniejszą korzyść.
- **Kluczowe komponenty widoku:**
  - `HeroSection.astro` (statyczny, z responsywną typografią, optymalizacją LCP).
  - `FeatureGrid.astro` (karty funkcji z ikonami w SVG).
  - `ChartPreview.astro` (optymalizowany obraz + alt tekst, może mieć warstwę z pseudo-animacją CSS).
  - `TestimonialsCarousel.tsx` (React tylko jeśli pojawi się interaktywność; w wersji MVP może być statyczny Astro).
  - `FAQSection.astro`.
  - `PrimaryCTA.astro`.
  - Wspólne przyciski `Button` (Shadcn/ui).
- **UX, dostępność, SEO, wydajność:**
  - **UX:** Pierwszy ekran (Hero) musi zawierać jasny komunikat + CTA bez scrollowania (Above the fold). Unikanie zbyt długich bloków tekstu.
  - **Dostępność:** Semantyczne landmarki (`<header>`, `<main>`, `<footer>`); alternatywny tekst dla screena wykresu wyjaśniający co przedstawia.
  - **SEO:** Meta title, meta description, strukturalne nagłówki H1–H2; `faq` może użyć schema.org FAQPage (opcjonalnie w późniejszym etapie).
  - **Wydajność:** Obrazy w formatach AVIF/WebP; prefetch zasobów dla `/login` i `/register` (link rel="prefetch"). Unikanie ciężkich zależności na stronie startowej.
  - **Zachowanie zalogowanego użytkownika:** Middleware automatycznie przekieruje na `/dashboard` jeśli sesja istnieje.

### Strona Logowania
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie powracającym użytkownikom zalogowania się do aplikacji.
- **Kluczowe informacje:** Formularz (email, hasło), link do rejestracji.
- **Komponenty:** `Card`, `Input`, `Button`, `Toast` (błędy), prosty link "Nie masz konta? Zarejestruj się".
- **UX:** Natychmiastowa walidacja formatów email; komunikaty błędów w `Toast` + inline opis przy polu.
- **Dostępność:** Etykiety, `aria-live` dla komunikatów błędów.
- **Bezpieczeństwo:** Brak ekspozycji danych; ochrona przed brute force (logika po stronie API).

### Strona Rejestracji
- **Ścieżka widoku:** `/register`
- **Główny cel:** Konwersja nowych użytkowników.
- **Kluczowe informacje:** Formularz (email, hasło, powtórz hasło opcjonalnie) + komunikat o polityce prywatności.
- **Komponenty:** `Card`, `Input`, `PasswordStrength` (opcjonalnie), `Button`, `Toast`.
- **UX:** Jasna informacja o wymaganiach hasła; możliwość pokazania/ukrycia hasła.
- **Dostępność:** Powiązania etykiet, opisy wymagań (`aria-describedby`).
- **Bezpieczeństwo:** Walidacja po stronie klienta + serwera; szyfrowane połączenie; brak logiki biznesowej w UI.

### Pulpit Nawigacyjny (Dashboard)
- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Prezentacja podsumowania sytuacji finansowej użytkownika w bieżącym miesiącu.
- **Kluczowe informacje do wyświetlenia:**
    - Suma przychodów, wydatków i bilans.
    - Wykres słupkowy top 5 kategorii wydatków.
    - Tekstowe podsumowanie wygenerowane przez AI.
- **Kluczowe komponenty widoku:**
    - `Card` (Shadcn/ui) do prezentacji kluczowych metryk (przychody, wydatki, bilans).
    - `BarChart` (Recharts/Visx) do wizualizacji wydatków.
    - `Button` (Shadcn/ui) "Dodaj transakcję", otwierający modal.
    - `AddTransactionDialog` (komponent niestandardowy).
    - `Skeleton` (Shadcn/ui) jako wskaźnik ładowania danych.
    - Komponent stanu pustego (Empty State) z wezwaniem do działania (CTA), gdy brak transakcji.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Dane odświeżają się automatycznie po dodaniu nowej transakcji. Na urządzeniach mobilnych siatka kart zamienia się w jedną kolumnę.
    - **Dostępność:** Wykresy muszą mieć alternatywę tekstową (np. tabela danych).
    - **Bezpieczeństwo:** Dostęp do widoku chroniony przez middleware w Astro.

### Lista Transakcji
- **Ścieżka widoku:** `/transactions`
- **Główny cel:** Umożliwienie przeglądania, filtrowania i zarządzania wszystkimi transakcjami.
- **Kluczowe informacje do wyświetlenia:** Tabela lub lista transakcji z podziałem na strony, zawierająca datę, opis, kwotę, typ i kategorię.
- **Kluczowe komponenty widoku:**
    - `Table` (Shadcn/ui) do wyświetlania transakcji na większych ekranach.
    - `Card` (Shadcn/ui) do wyświetlania transakcji w formie listy na mniejszych ekranach.
    - `Pagination` (Shadcn/ui) do nawigacji między stronami.
    - `DropdownMenu` (Shadcn/ui) dla akcji (Edytuj, Usuń) przy każdej transakcji.
    - `AddTransactionDialog` (współdzielony z pulpitem).
    - `AlertDialog` (Shadcn/ui) do potwierdzenia usunięcia transakcji.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Responsywna tabela, która na telefonach zmienia się w listę kart. Paginacja po stronie klienta zapewnia szybkie przełączanie stron.
    - **Dostępność:** Tabela powinna mieć odpowiednie nagłówki (`<th>`) i zakresy (`scope`).
    - **Bezpieczeństwo:** Dostęp do widoku chroniony przez middleware.

### Strona Ustawień
- **Ścieżka widoku:** `/settings`
- **Główny cel:** Zarządzanie kontem użytkownika.
- **Kluczowe informacje do wyświetlenia:** Informacje o profilu użytkownika, opcja usunięcia konta.
- **Kluczowe komponenty widoku:**
    - `Button` (Shadcn/ui) z wariantem `destructive` do akcji "Usuń konto".
    - `AlertDialog` (Shadcn/ui) do ostatecznego potwierdzenia usunięcia konta.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Wyraźne ostrzeżenie o nieodwracalności usunięcia konta.
    - **Dostępność:** Przycisk usuwania musi być jasno opisany.
    - **Bezpieczeństwo:** Dostęp do widoku chroniony przez middleware.

## 3. Mapa podróży użytkownika

1.  **Rejestracja/Logowanie:**
    - Nowy użytkownik wchodzi na stronę główną (`/`), klika "Zarejestruj się za darmo" i jest przenoszony na stronę `/register`. Wypełnia formularz i tworzy konto.
    - Powracający użytkownik wchodzi na stronę główną (`/`), klika "Zaloguj się" i jest przenoszony na stronę `/login`. Podaje swoje dane i loguje się.
    - Po pomyślnym uwierzytelnieniu użytkownik jest przekierowywany na `/dashboard`.

2.  **Rejestracja / Logowanie:**
    - Na `/register` wypełnia formularz, po sukcesie następuje automatyczne zalogowanie i przekierowanie do `/dashboard`.
    - Na `/login` podaje dane i po walidacji trafia na `/dashboard`.

3.  **Główny przepływ (dodawanie i przeglądanie transakcji):**
    - Użytkownik ląduje na pulpicie nawigacyjnym (`/dashboard`).
    - Jeśli nie ma transakcji, widzi stan pusty i klika "Dodaj swoją pierwszą transakcję".
    - Otwiera się modal `AddTransactionDialog`. Użytkownik wypełnia formularz (typ, kwota, opis, data) i klika "Zapisz".
    - Modal się zamyka, a dane na pulpicie (`/dashboard`) automatycznie się odświeżają, pokazując nową transakcję i zaktualizowane podsumowania.
    - Użytkownik przechodzi do listy transakcji (`/transactions`), aby zobaczyć szczegóły.
    - Na liście transakcji może edytować lub usunąć istniejącą pozycję za pomocą menu kontekstowego.

4.  **Usuwanie konta:**
    - Użytkownik przechodzi do strony `/settings`.
    - Klika przycisk "Usuń konto".
    - W oknie dialogowym potwierdza swoją decyzję.
    - Jego konto i wszystkie dane są usuwane, a on zostaje wylogowany i przekierowany na stronę główną (`/`).

## 4. Układ i struktura nawigacji

Aplikacja będzie miała prosty, ale spójny układ oparty o komponent `Layout.astro`.

- **Główny Layout:**
    - **Nagłówek (Header):** Zawiera logo aplikacji, główne linki nawigacyjne oraz menu użytkownika.
    - **Nawigacja główna (zalogowany):** Linki do "Pulpitu" (`/dashboard`) i "Transakcji" (`/transactions`).
    - **Nawigacja marketingowa (Landing Page):** Anchory do sekcji: Funkcje, Jak to działa, FAQ (np. `/#features`, `/#how-it-works`, `/#faq`).
    - **Menu użytkownika:** Po zalogowaniu w prawym górnym rogu znajduje się ikona użytkownika z `DropdownMenu`, które zawiera link do "Ustawień" (`/settings`) oraz opcję "Wyloguj".
    - **Główna treść (Main):** Centralna część strony, w której renderowane są poszczególne widoki.
    - **Stopka (Footer):** Zawiera informacje: rok, nazwa aplikacji, skrócone linki (Polityka prywatności, Regulamin – przyszłe rozszerzenia).

- **Nawigacja dla niezalogowanych:** Nagłówek na stronie głównej (`/`) zawiera linki "Zaloguj się" (`/login`) i "Zarejestruj się" (`/register`) oraz anchor linki do sekcji. Na stronach `/login` i `/register` nawigacja jest minimalna (logo + link powrotu na `/`).
- **Nawigacja dla zalogowanych:** Po zalogowaniu użytkownik ma dostęp do pełnej nawigacji aplikacyjnej bez sekcji marketingowych.
- **Zachowanie responsywne:** Na urządzeniach mobilnych menu zwijane w `Sheet` / `Drawer` (Shadcn/ui) – decyzja w późniejszym etapie.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, współdzielonych komponentów React/Astro, które będą używane w całej aplikacji.

- **`HeroSection` (Astro):** Sekcja otwierająca z nagłówkiem, podtytułem i przyciskami CTA. Minimalna interaktywność – statyczny rendering.
- **`FeatureGrid` (Astro):** Siatka kart funkcji z ikonami w SVG. Możliwość parametryzacji kolejności.
- **`ChartPreview` (Astro):** Komponent wyświetlający zoptymalizowany obraz dashboardu (Astro Image) + opis dostępności.
- **`TestimonialsCarousel` (React opcjonalnie):** Karuzela opinii – w MVP może być statyczna lista; React wersja jeśli dodamy auto-slide / interaktywność pauzy.
- **`FAQSection` (Astro):** Lista pytań i odpowiedzi z semantyką akordeonu (opcjonalnie później jako prosty markup).
- **`PrimaryCTA` (Astro):** Powtarzający blok CTA zamykający stronę Landing Page.
- **`AddTransactionDialog`:** Modal (oparty na `Dialog` z Shadcn/ui) zawierający formularz do dodawania i edycji transakcji. Będzie wykorzystywany zarówno na pulpicie, jak i na liście transakcji. Komponent będzie zarządzał swoim stanem formularza i komunikacją z API w celu zapisu danych.
- **`Toast`:** Globalny system powiadomień (z Shadcn/ui) do informowania użytkownika o sukcesie (np. "Transakcja dodana pomyślnie") lub porażce (np. "Błąd serwera") operacji.
- **`Skeleton`:** Komponenty-szkielety (z Shadcn/ui) używane jako wskaźniki ładowania na pulpicie i liście transakcji podczas pobierania danych z API.
- **`Pagination`:** Komponent (z Shadcn/ui) do obsługi paginacji po stronie klienta na widoku listy transakcji.
- **`EmptyState`:** Komponent wyświetlany, gdy na pulpicie lub liście transakcji nie ma żadnych danych do pokazania. Zawiera grafikę, komunikat i przycisk z wezwaniem do działania (CTA), np. "Dodaj pierwszą transakcję".
- **`AuthForm` (React):** Wspólny komponent pól formularza logowania/rejestracji parametryzowany trybem.
- **`PasswordStrength` (React opcjonalnie):** Wizualny wskaźnik jakości hasła.
- **`ProtectedRoute` (logika w middleware Astro):** Nie komponent UI, ale wzorzec – dokumentacja w kodzie jak wymuszać autoryzację.

// Dalsze komponenty mogą być dodane w miarę rozwoju (np. OnboardingWizard, BudgetGoals, CategoryInsights) – poza zakresem MVP.
