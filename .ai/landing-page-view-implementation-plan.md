# Plan implementacji widoku: Strona Główna (Landing Page)

## 1. Przegląd
Strona główna (`Landing Page`) jest publicznie dostępnym punktem wejścia do aplikacji SmartBudgetAI. Jej głównym celem jest przedstawienie wartości produktu nowym użytkownikom i zachęcenie ich do rejestracji. Strona ma charakter marketingowy, jest w pełni statyczna i zoptymalizowana pod kątem wydajności oraz SEO.

## 2. Routing widoku
- **Ścieżka**: `/`
- **Dostępność**: Publiczna. Użytkownicy zalogowani, którzy spróbują uzyskać dostęp do tej strony, zostaną automatycznie przekierowani na `/dashboard` przez middleware.

## 3. Struktura komponentów
Strona będzie zbudowana z reużywalnych, statycznych komponentów Astro, zorganizowanych w celu zapewnienia czytelności i łatwości utrzymania. Komponenty UI, takie jak przyciski, będą pochodzić z biblioteki Shadcn/ui.

```
/pages/index.astro
└── /layouts/Layout.astro
    ├── Header (z przyciskami "Zaloguj się" i "Zarejestruj się")
    ├── <main>
    │   ├── /components/landing/HeroSection.astro
    │   ├── /components/landing/FeatureGrid.astro
    │   ├── /components/landing/ChartPreview.astro
    │   ├── /components/landing/HowItWorksSection.astro
    │   ├── /components/landing/FAQSection.astro
    │   └── /components/landing/FinalCTASection.astro
    └── Footer
```

## 4. Szczegóły komponentów

### `HeroSection.astro`
- **Opis**: Pierwsza sekcja widoczna po załadowaniu strony. Zawiera chwytliwe hasło (H1), krótki opis korzyści oraz dwa główne przyciski wezwania do działania (CTA).
- **Główne elementy**:
    - `h1`: Główne hasło marketingowe.
    - `p`: Podtytuł rozwijający hasło.
    - `div` (kontener na przyciski):
        - `Button` (primary): "Zarejestruj się za darmo"
        - `Button` (secondary/outline): "Zaloguj się"
- **Obsługiwane interakcje**:
    - Kliknięcie przycisku "Zarejestruj się za darmo" nawiguje do `/register`.
    - Kliknięcie przycisku "Zaloguj się" nawiguje do `/login`.
- **Typy**: Brak.
- **Propsy**: Brak.

### `FeatureGrid.astro`
- **Opis**: Prezentuje kluczowe funkcje aplikacji w formie siatki (3-4 kolumny). Każdy element siatki to karta z ikoną, tytułem i krótkim opisem.
- **Główne elementy**:
    - `section` z `div` (kontener grid).
    - Karty funkcji, każda zawierająca:
        - Ikonę (SVG).
        - `h3`: Nazwa funkcji.
        - `p`: Krótki opis.
- **Obsługiwane interakcje**: Brak.
- **Typy**: `Feature { icon: string; title: string; description: string; }`
- **Propsy**: `features: Feature[]`

### `ChartPreview.astro`
- **Opis**: Sekcja wizualna, której celem jest pokazanie, jak wygląda interfejs aplikacji (dashboard). Zawiera statyczny, zoptymalizowany obraz.
- **Główne elementy**:
    - `Image` (komponent Astro): Wyświetla zoptymalizowany obraz z odpowiednim atrybutem `alt`.
- **Obsługiwane interakcje**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `HowItWorksSection.astro`
- **Opis**: Wyjaśnia działanie aplikacji w prostych, ponumerowanych krokach (np. 1. Dodaj transakcję, 2. AI kategoryzuje, 3. Analizuj raporty).
- **Główne elementy**:
    - `div` (kontener flex/grid) na kroki.
    - Elementy kroków, każdy zawierający:
        - Numer kroku.
        - `h3`: Tytuł kroku.
        - `p`: Opis kroku.
- **Obsługiwane interakcje**: Brak.
- **Typy**: `Step { number: number; title: string; description: string; }`
- **Propsy**: `steps: Step[]`

### `FAQSection.astro`
- **Opis**: Sekcja z najczęściej zadawanymi pytaniami, aby rozwiać wątpliwości potencjalnych użytkowników. Może wykorzystywać komponent `Accordion` z Shadcn/ui dla lepszej organizacji.
- **Główne elementy**:
    - `Accordion` (jeśli interaktywny) lub statyczna lista pytań i odpowiedzi.
    - Każdy element zawiera:
        - `h3`: Pytanie.
        - `p`: Odpowiedź.
- **Obsługiwane interakcje**: Rozwijanie/zwijanie odpowiedzi (jeśli użyto akordeonu).
- **Typy**: `FAQItem { question: string; answer: string; }`
- **Propsy**: `items: FAQItem[]`

## 5. Typy
Ponieważ strona jest statyczna, typy służą głównie do organizacji danych przekazywanych jako propsy do komponentów.

- **`Feature`**:
  - `icon: string` - Nazwa lub ścieżka do ikony SVG.
  - `title: string` - Tytuł funkcji.
  - `description: string` - Krótki opis funkcji.

- **`Step`**:
  - `number: number` - Numer kroku.
  - `title: string` - Tytuł kroku.
  - `description: string` - Opis czynności w danym kroku.

- **`FAQItem`**:
  - `question: string` - Pytanie użytkownika.
  - `answer: string` - Odpowiedź na pytanie.

## 6. Zarządzanie stanem
Nie jest wymagane zarządzanie stanem. Widok jest w 100% statyczny i nie przechowuje żadnego stanu po stronie klienta.

## 7. Integracja API
Brak integracji z API. Strona nie pobiera ani nie wysyła żadnych danych do backendu.

## 8. Interakcje użytkownika
- **Nawigacja**: Użytkownik może klikać przyciski "Zarejestruj się" i "Zaloguj się", co spowoduje przejście do odpowiednich stron.
- **Przewijanie**: Użytkownik przewija stronę, aby zapoznać się z jej treścią.
- **Interakcja z FAQ**: Jeśli zostanie użyty komponent akordeonu, użytkownik będzie mógł klikać pytania, aby odkryć odpowiedzi.

## 9. Warunki i walidacja
Brak logiki warunkowej i walidacji, ponieważ strona nie zawiera formularzy ani dynamicznych danych.

## 10. Obsługa błędów
Brak specyficznych scenariuszy błędów. Należy zadbać o poprawność linków nawigacyjnych oraz o to, by wszystkie zasoby (obrazy, ikony) ładowały się poprawnie.

## 11. Kroki implementacji
1.  **Utworzenie pliku strony**: Stworzyć plik `/src/pages/index.astro`.
2.  **Struktura katalogów**: Utworzyć katalog `/src/components/landing` na komponenty tej strony.
3.  **Implementacja `Layout.astro`**: Upewnić się, że główny layout zawiera odpowiedni `Header` z linkami do logowania/rejestracji oraz `Footer`.
4.  **Implementacja `HeroSection.astro`**: Stworzyć komponent, dodać teksty marketingowe i przyciski `Button` z Shadcn/ui.
5.  **Implementacja pozostałych sekcji**: Stopniowo tworzyć komponenty: `FeatureGrid.astro`, `ChartPreview.astro`, `HowItWorksSection.astro`, `FAQSection.astro` i `FinalCTASection.astro`. Dane do tych komponentów (listy funkcji, kroków, pytań) można na razie zaszyć na stałe wewnątrz komponentów lub przekazać z `index.astro`.
6.  **Optymalizacja zasobów**: Użyć komponentu `<Image>` z Astro dla `ChartPreview.astro` i ewentualnych innych obrazów. Zoptymalizować ikony SVG.
7.  **Stylowanie**: Ostylować wszystkie komponenty i sekcje przy użyciu Tailwind CSS, dbając o responsywność (RWD) na różnych urządzeniach.
8.  **SEO i Dostępność**: Dodać odpowiednie meta tagi w `Layout.astro` lub `index.astro`. Upewnić się, że struktura nagłówków (H1, H2, H3) jest logiczna, a obrazy mają atrybuty `alt`.
9.  **Weryfikacja middleware**: Sprawdzić, czy `src/middleware/index.ts` poprawnie przekierowuje zalogowanych użytkowników z `/` na `/dashboard`.
10. **Przegląd i testy**: Ręcznie przetestować stronę na różnych przeglądarkach i rozmiarach ekranu. Sprawdzić działanie wszystkich linków.

