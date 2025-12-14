# Plan Testów dla Aplikacji SmartBudgetAI

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji webowej SmartBudgetAI. Aplikacja ta ma na celu ułatwienie użytkownikom zarządzania osobistymi finansami poprzez automatyczną kategoryzację wydatków z wykorzystaniem sztucznej inteligencji. Plan obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie wysokiej jakości, niezawodności i bezpieczeństwa aplikacji.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

- **Weryfikacja Funkcjonalności:** Upewnienie się, że wszystkie funkcje aplikacji działają zgodnie z wymaganiami, w tym zarządzanie transakcjami, uwierzytelnianie, profil użytkownika oraz panel administracyjny.
- **Zapewnienie Jakości Kategoryzacji AI:** Ocena i zapewnienie wysokiej trafności mechanizmu automatycznej kategoryzacji transakcji, który jest kluczowym elementem systemu.
- **Zapewnienie Niezawodności i Wydajności:** Sprawdzenie, czy aplikacja działa stabilnie i wydajnie pod różnym obciążeniem.
- **Weryfikacja Bezpieczeństwa:** Identyfikacja i eliminacja potencjalnych luk w zabezpieczeniach, zwłaszcza w kontekście danych finansowych użytkowników.
- **Zapewnienie Użyteczności (UX/UI):** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, responsywny i zgodny z projektem na różnych urządzeniach i przeglądarkach.
- **Wykrycie i Raportowanie Błędów:** Systematyczne identyfikowanie, dokumentowanie i śledzenie defektów w celu ich naprawy przed wdrożeniem produkcyjnym.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami:

- **Moduł Uwierzytelniania i Zarządzania Kontem:**
  - Rejestracja nowego użytkownika.
  - Logowanie i wylogowywanie.
  - Mechanizm "Zapomniałem hasła".
  - Edycja danych profilowych.
  - Usuwanie konta użytkownika.
  - Ochrona tras wymagających autoryzacji.
- **Moduł Zarządzania Transakcjami:**
  - Dodawanie nowych transakcji (przychody i wydatki).
  - Wyświetlanie listy transakcji.
  - Filtrowanie i sortowanie transakcji.
  - Automatyczna kategoryzacja transakcji przez AI.
- **Panel Główny (Dashboard):**
  - Wyświetlanie podsumowania finansowego.
  - Poprawność danych na wykresach (kołowy wydatków, dzienny przychodów/wydatków).
  - Wyświetlanie podsumowania od AI.
- **Moduł Feedbacku AI:**
  - Możliwość zgłaszania sugestii/poprawek do kategoryzacji AI.
- **Panel Administracyjny:**
  - Logowanie administratora.
  - Przeglądanie i filtrowanie zgłoszeń (feedbacku) od użytkowników.
  - Wyświetlanie statystyk dotyczących kategoryzacji i wydajności AI.
- **Aspekty Niefunkcjonalne:**
  - Responsywność interfejsu (RWD).
  - Kompatybilność z różnymi przeglądarkami.
  - Wydajność ładowania stron i odpowiedzi API.
  - Bezpieczeństwo (ochrona przed XSS, CSRF, SQL Injection, weryfikacja polityk RLS w Supabase).

### 2.2. Funkcjonalności wyłączone z testów:

- Testy wewnętrznej infrastruktury Supabase (zakładamy jej niezawodność jako usługi zewnętrznej).
- Testy zewnętrzne (np. dostawcy usług e-mail do resetu hasła).

## 3. Typy Testów

1.  **Testy Jednostkowe (Unit Tests):**
    - **Cel:** Weryfikacja poprawności działania pojedynczych funkcji, komponentów React i serwisów w izolacji.
    - **Zakres:** Logika biznesowa w `src/lib/services`, funkcje pomocnicze w `src/lib/utils.ts`, hooki React w `src/components/hooks`, komponenty UI w `src/components`.
2.  **Testy Integracyjne (Integration Tests):**
    - **Cel:** Sprawdzenie współpracy pomiędzy różnymi częściami systemu.
    - **Zakres:** Testowanie endpointów API Astro (`src/pages/api/**/*.test.ts`), weryfikacja interakcji komponentów z API, sprawdzanie poprawności działania middleware (`src/middleware/index.ts`).
3.  **Testy End-to-End (E2E):**
    - **Cel:** Symulacja rzeczywistych scenariuszy użytkowania aplikacji z perspektywy użytkownika końcowego w przeglądarce.
    - **Zakres:** Pełne ścieżki użytkownika, np. od rejestracji, przez dodanie transakcji, po wylogowanie. Weryfikacja polityk bezpieczeństwa danych (np. czy użytkownik A widzi tylko swoje dane).
4.  **Testy Akceptacyjne Użytkownika (UAT):**
    - **Cel:** Potwierdzenie, że aplikacja spełnia wymagania biznesowe i jest gotowa do wdrożenia.
    - **Zakres:** Przeprowadzane przez właściciela produktu lub wyznaczoną grupę użytkowników.
5.  **Testy Kompatybilności:**
    - **Cel:** Zapewnienie poprawnego działania i wyświetlania aplikacji na różnych przeglądarkach i urządzeniach.
    - **Zakres:** Testy manualne na najpopularniejszych przeglądarkach (Chrome, Firefox, Safari) i urządzeniach mobilnych (iOS, Android).
6.  **Testy Wydajnościowe:**
    - **Cel:** Ocena szybkości ładowania stron i czasu odpowiedzi API pod obciążeniem.
    - **Zakres:** Podstawowe testy ładowania kluczowych stron (Dashboard, Transactions) przy użyciu narzędzi deweloperskich przeglądarki (Lighthouse).

## 4. Scenariusze Testowe (Przykładowe)

### Scenariusz 1: Rejestracja i pierwsze logowanie

1.  Przejdź na stronę `/register`.
2.  Wypełnij formularz poprawnymi danymi (unikalny e-mail, hasło spełniające kryteria).
3.  Zweryfikuj, że po rejestracji użytkownik jest przekierowany na stronę `/dashboard`.
4.  Wyloguj się.
5.  Przejdź na stronę `/login`.
6.  Zaloguj się przy użyciu danych z kroku 2.
7.  Zweryfikuj, że logowanie powiodło się i użytkownik jest na stronie `/dashboard`.

### Scenariusz 2: Dodawanie i kategoryzacja transakcji

1.  Będąc zalogowanym, przejdź do widoku transakcji.
2.  Otwórz dialog "Dodaj transakcję".
3.  Wprowadź dane wydatku (np. "Bilet do kina", kwota: 25, data: dzisiaj).
4.  Zatwierdź formularz.
5.  Zweryfikuj, że nowa transakcja pojawiła się na liście.
6.  Sprawdź, czy system AI automatycznie przypisał jej kategorię (np. "Rozrywka").
7.  Przejdź do panelu głównego i zweryfikuj, czy wykres wydatków został zaktualizowany.

### Scenariusz 3: Zgłaszanie feedbacku do kategoryzacji

1.  Znajdź transakcję z niepoprawną kategorią.
2.  Użyj opcji "Zgłoś problem z kategoryzacją".
3.  Wybierz poprawną kategorię z listy i wyślij formularz.
4.  Zaloguj się na konto administratora.
5.  Przejdź do panelu "Feedbacks".
6.  Zweryfikuj, że nowe zgłoszenie jest widoczne na liście.

### Scenariusz 4: Izolacja danych użytkownika (Test bezpieczeństwa RLS)

1.  Utwórz dwóch użytkowników: UżytkownikA i UżytkownikB.
2.  Zaloguj się jako UżytkownikA i dodaj kilka transakcji.
3.  Wyloguj się.
4.  Zaloguj się jako UżytkownikB.
5.  Przejdź do widoku transakcji i zweryfikuj, że transakcje UżytkownikaA nie są widoczne.
6.  Spróbuj (np. używając narzędzi deweloperskich) odpytać API o dane transakcji UżytkownikaA, będąc zalogowanym jako UżytkownikB. Oczekiwany rezultat: błąd autoryzacji lub pusta odpowiedź.

## 5. Środowisko Testowe

- **Środowisko lokalne (deweloperskie):** Używane do testów jednostkowych i integracyjnych uruchamianych lokalnie przez deweloperów.
- **Środowisko stagingowe (przedprodukcyjne):** Oddzielna instancja aplikacji z własną bazą danych Supabase, na której będą przeprowadzane testy E2E i UAT. Środowisko to powinno być jak najbardziej zbliżone do środowiska produkcyjnego.
- **Przeglądarki:**
  - Google Chrome (najnowsza wersja)
  - Mozilla Firefox (najnowsza wersja)
  - Apple Safari (najnowsza wersja)
- **Urządzenia:**
  - Desktop (Windows, macOS)
  - Urządzenia mobilne (symulacja w Chrome DevTools oraz testy na fizycznych urządzeniach z iOS i Androidem).

## 6. Narzędzia do Testowania

- **Framework do testów jednostkowych i integracyjnych:** [Vitest](https://vitest.dev/) (zgodnie z konfiguracją projektu).
- **Biblioteka do testowania komponentów React:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) (do testowania komponentów w izolacji).
- **Framework do testów E2E:** [Playwright](https://playwright.dev/) (rekomendowany ze względu na szybkość, niezawodność i wsparcie dla wielu przeglądarek).
- **Narzędzie do mockowania API:** [Mock Service Worker (MSW)](https://mswjs.io/) (do izolowania testów frontendowych od backendu).
- **Narzędzia deweloperskie przeglądarki:** Do debugowania, inspekcji i podstawowych testów wydajności (Lighthouse).
- **System CI/CD:** GitHub Actions (do automatycznego uruchamiania testów po każdym pushu do repozytorium).

## 7. Harmonogram Testów

Proces testowania będzie prowadzony w sposób ciągły, zintegrowany z cyklem deweloperskim.

- **Testy jednostkowe i integracyjne:** Pisane na bieżąco przez deweloperów wraz z nowymi funkcjonalnościami. Muszą być wykonane i zakończone powodzeniem przed każdym mergem do głównej gałęzi.
- **Testy E2E:** Uruchamiane automatycznie w środowisku CI/CD po każdym pushu do gałęzi `main` oraz przed każdym wdrożeniem na produkcję.
- **Testy UAT:** Przeprowadzane na środowisku stagingowym przed planowanym wdrożeniem nowej wersji aplikacji. Czas trwania: 2-3 dni robocze.
- **Testy regresji:** Automatyczne (jednostkowe, integracyjne, E2E) i manualne (kluczowe ścieżki) przed każdym wydaniem.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia

- Kod źródłowy został wdrożony na środowisku testowym.
- Wszystkie testy jednostkowe i integracyjne przechodzą pomyślnie.
- Dostępna jest dokumentacja wymagań dla testowanych funkcjonalności.

### 8.2. Kryteria Wyjścia (Definicja Ukończenia)

- **100%** zaplanowanych scenariuszy testowych zostało wykonanych.
- **95%** pokrycia kodu testami jednostkowymi i integracyjnymi dla nowej logiki biznesowej.
- **Brak krytycznych i wysokich błędów** (blokujących) w systemie.
- Wszystkie błędy o priorytecie średnim i niskim zostały udokumentowane i zaplanowane do naprawy w przyszłych sprintach.
- Testy UAT zostały zakończone i zaakceptowane przez właściciela produktu.

## 9. Role i Odpowiedzialności

- **Deweloperzy:**
  - Pisanie testów jednostkowych i integracyjnych dla tworzonego kodu.
  - Naprawianie błędów wykrytych na wszystkich etapach testowania.
  - Utrzymanie i rozwijanie zautomatyzowanych testów.
- **Inżynier QA / Tester:**
  - Tworzenie i utrzymanie planu testów.
  - Projektowanie i implementacja testów E2E.
  - Przeprowadzanie testów manualnych (eksploracyjnych, kompatybilności).
  - Zarządzanie procesem raportowania błędów.
- **Właściciel Produktu (Product Owner):**
  - Dostarczanie wymagań i kryteriów akceptacji.
  - Przeprowadzanie i akceptacja testów UAT.
  - Priorytetyzacja naprawy błędów.

## 10. Procedury Raportowania Błędów

1.  **Identyfikacja Błędu:** Każdy znaleziony błąd musi zostać udokumentowany.
2.  **Narzędzie:** Do śledzenia błędów zostanie wykorzystany system **GitHub Issues**.
3.  **Struktura Zgłoszenia Błędu:** Każde zgłoszenie powinno zawierać:
    - **Tytuł:** Krótki, zwięzły opis problemu.
    - **Opis:**
      - **Kroki do odtworzenia (Steps to Reproduce):** Szczegółowa lista kroków.
      - **Obserwowane zachowanie (Actual Result):** Co się stało.
      - **Oczekiwane zachowanie (Expected Result):** Co powinno się stać.
    - **Środowisko:** Wersja przeglądarki, system operacyjny, urządzenie.
    - **Zrzuty ekranu / Nagrania wideo:** Jeśli to możliwe, w celu lepszej ilustracji problemu.
    - **Priorytet:**
      - **Krytyczny (Critical):** Błąd blokujący kluczowe funkcjonalności, uniemożliwiający dalsze testy.
      - **Wysoki (High):** Poważny błąd w kluczowej funkcjonalności, ale istnieje obejście.
      - **Średni (Medium):** Błąd w mniej istotnej funkcjonalności lub problem z UI.
      - **Niski (Low):** Drobny problem kosmetyczny, literówka.
4.  **Cykl Życia Błędu:**
    - `Open`: Nowo zgłoszony błąd.
    - `In Progress`: Błąd jest w trakcie analizy lub naprawy.
    - `Ready for Review`: Naprawa została zaimplementowana i czeka na weryfikację.
    - `Closed`: Naprawa została zweryfikowana na środowisku testowym i błąd został zamknięty.
    - `Won't Fix`: Błąd nie zostanie naprawiony (np. z powodów biznesowych).
