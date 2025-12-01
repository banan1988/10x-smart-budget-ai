# Plan implementacji widoku Opinii użytkowników

## 1. Przegląd
Widok Opinii użytkowników umożliwia zalogowanym użytkownikom szybkie i łatwe przesyłanie opinii na temat aplikacji. Widok zawiera pływającą ikonę lub przycisk widoczny w interfejsie użytkownika, który uruchamia modalny formularz. Formularz pozwala użytkownikom wystawić ocenę w skali od 1 do 5 oraz dodać opcjonalny komentarz do 1000 znaków. Po przesłaniu formularz wysyła dane do backendu za pośrednictwem endpointu `POST /api/feedbacks`. Użytkownik otrzymuje potwierdzenie o pomyślnym przesłaniu opinii lub komunikat o błędzie w przypadku niepowodzenia, z możliwością ponownej próby.

## 2. Routing widoku
- **Ścieżka:** Widok jest zintegrowany jako pływający element dostępny na wszystkich stronach dla zalogowanych użytkowników.
- **Dostęp:** Widok jest dostępny wyłącznie dla zalogowanych użytkowników. Formularz będzie ukryty lub niedostępny dla użytkowników niezalogowanych.
- **Umieszczenie:** Pływająca ikona/przycisk znajduje się w dolnym prawym rogu ekranu (stała pozycja).
- **Integracja:** Element jest renderowany w komponencie `Layout.astro` lub `AppFooter.astro`, aby był dostępny na wszystkich stronach.

## 3. Struktura komponentów
```
Layout.astro (lub AppFooter.astro)
└── FeedbackButton.tsx
    └── FeedbackDialog.tsx
        ├── DialogHeader (Shadcn/ui)
        ├── DialogContent (Shadcn/ui)
        │   ├── FeedbackForm.tsx
        │   │   ├── Label (Shadcn/ui)
        │   ├── Input / Select (Shadcn/ui)
        │   ├── Textarea (Shadcn/ui)
        │   ├── Button "Prześlij" (Shadcn/ui)
        │   ├── Button "Anuluj" (Shadcn/ui)
        │   └── Toast / Alert dla komunikatów
        └── DialogFooter (Shadcn/ui)
```

## 4. Szczegóły komponentów

### `FeedbackButton.tsx`
- **Opis komponentu:** Pływający przycisk/ikona uruchamiający dialog opinii. Komponent zarządza widocznością dialogu i przepuszczalnością dostępu.
- **Główne elementy:**
    - Ikonka (np. z `lucide-react` lub innej biblioteki ikon) lub tekst przycisku.
    - Pozycjonowanie: CSS `fixed` w dolnym prawym rogu ekranu.
    - Obsługa widoczności dla zalogowanych użytkowników.
    - Przycisk z wariantem `floating` lub `round` dla lepszego UX.
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku otwiera `FeedbackDialog`.
    - Zmiany stanu otwartości dialogu są zarządzane przez state komponentu.
- **Obsługiwana walidacja:** Brak walidacji na tym poziomie; delegowana do `FeedbackForm`.
- **Typy:** `FeedbackButtonVM`.
- **Propsy:**
    - `isAuthenticated: boolean` - flaga wskazująca, czy użytkownik jest zalogowany.
    - `userId?: string` - opcjonalnie ID zalogowanego użytkownika (dla logowania).

### `FeedbackDialog.tsx`
- **Opis komponentu:** Modalny dialog zawierający formularz opinii. Zarządza otwarciem/zamknięciem oraz deleguje obsługę formularza do `FeedbackForm`.
- **Główne elementy:**
    - `<Dialog>` (Shadcn/ui) - kontener modalu.
    - `<DialogHeader>` - nagłówek z tytułem "Prześlij opinię".
    - `<DialogContent>` - zawiera `FeedbackForm`.
    - `<DialogFooter>` - opcjonalnie, dla przycisku zamykającego.
    - Obsługa stanu otwartości (`isOpen`).
- **Obsługiwane interakcje:**
    - Kliknięcie przycisku zamykającego (X) lub kliknięcie poza dialogiem zamyka dialog.
    - Kliknięcie "Anuluj" w formularzu zamyka dialog bez wysyłania.
    - Kliknięcie "Prześlij" w formularzu wysyła dane i zamyka dialog po sukcesie.
- **Obsługiwana walidacja:** Brak na tym poziomie; delegowana do `FeedbackForm`.
- **Typy:** `FeedbackDialogVM`.
- **Propsy:**
    - `isOpen: boolean` - kontroluje widoczność dialogu.
    - `onOpenChange: (isOpen: boolean) => void` - callback zmiany stanu otwartości.
    - `children?: ReactNode` - zawartość dialogu (komponent `FeedbackForm`).

### `FeedbackForm.tsx`
- **Opis komponentu:** Formularz do zbierania opinii od użytkownika. Zawiera pola oceny i komentarza, walidację, obsługę wysyłania oraz wyświetlanie komunikatów o stanie (ładowanie, sukces, błąd).
- **Główne elementy:**
    - `<form>` - formularz główny.
    - `<fieldset>` - grupowanie pól formularza.
    - `<Label>` (Shadcn/ui) - etykieta dla oceny "Ocena aplikacji (1-5)".
    - `<Select>` lub `<RadioGroup>` (Shadcn/ui) - pole wyboru oceny (1-5).
    - `<Label>` - etykieta dla komentarza "Dodatkowe komentarze (opcjonalnie)".
    - `<Textarea>` (Shadcn/ui) - pole tekstowe na komentarz z licznikiem znaków.
    - `<Button>` - przycisk "Prześlij" (wariant `primary`, wyłączony podczas ładowania).
    - `<Button>` - przycisk "Anuluj" (wariant `outline`).
    - `<Alert>` lub `<Toast>` - komunikaty o stanie (ładowanie, sukces, błąd).
    - Wyświetlanie liczby znaków w komentarzu (dynamicznie aktualizowany).
- **Obsługiwane interakcje:**
    - Użytkownik wybiera ocenę (1-5).
    - Użytkownik wpisuje komentarz (opcjonalnie).
    - Użytkownik klika "Prześlij" - formularz jest walidowany.
    - Po pomyślnym przesłaniu pojawia się toast "Dziękujemy za opinię".
    - Po błędzie pojawia się komunikat o błędzie z możliwością ponowienia.
    - Użytkownik klika "Anuluj" - formularz jest czyżony, dialog zamyka się.
- **Obsługiwana walidacja:**
    - `rating`: Musi być wybrana ocena (wymagane); wartość musi być liczbą całkowitą od 1 do 5.
    - `comment`: String (opcjonalny); maksimum 1000 znaków; jeśli jest wypełniony, nie może zawierać tylko spacji.
    - Walidacja po stronie klienta: regex, długość stringa.
    - Walidacja po stronie serwera: dodatkowa walidacja na backendu.
- **Typy:** `FeedbackFormData`, `FeedbackRequest`, `ValidationError`.
- **Propsy:**
    - `onSubmitSuccess?: () => void` - callback wywoływany po pomyślnym przesłaniu.
    - `onCancel?: () => void` - callback wywoływany po kliknięciu anulowania.

## 5. Typy

### `FeedbackFormData` (ViewModel/Form Data)
Typ danych reprezentujący bieżący stan formularza opinii.
```typescript
interface FeedbackFormData {
  rating: number | null; // 1-5 lub null jeśli nie wybrano
  comment: string; // Może być puste
}
```
- **`rating`**: Ocena wybrana przez użytkownika (1-5) lub `null` jeśli jeszcze nie wybrana.
- **`comment`**: Tekst komentarza; domyślnie pusty string.

### `FeedbackRequest` (Request DTO)
Typ danych wysyłany do API przy przesłaniu opinii.
```typescript
interface FeedbackRequest {
  rating: number;
  comment: string;
}
```
- **`rating`**: Ocena (1-5).
- **`comment`**: Komentarz; może być pusty, ale maksymalnie 1000 znaków.

### `FeedbackResponse` (Response DTO)
Typ danych zwracany przez API po pomyślnym przesłaniu opinii.
```typescript
interface FeedbackResponse {
  message: string; // np. "Dziękujemy za Twoją opinię."
}
```
- **`message`**: Komunikat potwierdzenia od serwera.

### `FeedbackError` (Error DTO)
Typ danych reprezentujący błędy z API.
```typescript
interface FeedbackError {
  error: string; // np. "Bad Request"
  message: string; // Szczegółowy komunikat błędu
  details?: Record<string, string>; // Opcjonalne szczegóły walidacji dla każdego pola
}
```
- **`error`**: Typ błędu (np. "Bad Request", "Unauthorized").
- **`message`**: Opisowy komunikat błędu.
- **`details`**: Opcjonalne szczegóły, np. `{ "rating": "Rating must be between 1 and 5" }`.

### `FeedbackButtonVM` (ViewModel)
ViewModel dla komponentu `FeedbackButton`.
```typescript
interface FeedbackButtonVM {
  isAuthenticated: boolean;
  userId?: string;
}
```
- **`isAuthenticated`**: Flaga wskazująca, czy użytkownik jest zalogowany.
- **`userId`**: Opcjonalnie ID zalogowanego użytkownika.

### `FeedbackDialogVM` (ViewModel)
ViewModel dla komponentu `FeedbackDialog`.
```typescript
interface FeedbackDialogVM {
  isOpen: boolean;
  title: string; // np. "Prześlij opinię"
  description?: string; // Opcjonalny opis dialogu
}
```
- **`isOpen`**: Kontroluje widoczność dialogu.
- **`title`**: Tytuł dialogu.
- **`description`**: Opcjonalny opis lub instrukcja dla użytkownika.

### `ValidationError` (Error DTO)
Typ danych reprezentujący błędy walidacji pól formularza.
```typescript
interface ValidationError {
  field: string; // np. "rating" lub "comment"
  message: string; // Komunikat błędu
}
```
- **`field`**: Pole formularza, w którym występuje błąd.
- **`message`**: Opis błędu.

## 6. Zarządzanie stanem

### `FeedbackButton.tsx`
- **Stan lokalny:**
  - `isDialogOpen: boolean` - kontroluje widoczność dialogu opinii.
- **Nie wymaga dedykowanego hooka.**

### `FeedbackDialog.tsx`
- **Stan lokalny:**
  - Deleguje zarządzanie stanem do `FeedbackForm`.
  - Stan `isOpen` jest kontrolowany przez props i callback `onOpenChange`.
- **Nie wymaga dedykowanego hooka.**

### `FeedbackForm.tsx`
- **Stan lokalny:**
  - `formData: FeedbackFormData` - bieżące dane formularza (rating, comment).
  - `isLoading: boolean` - wskazuje, czy trwa wysyłanie formularza na serwer.
  - `error: ValidationError[] | null` - tablica błędów walidacji lub błędu serwera.
  - `successMessage: string | null` - komunikat o sukcesie.
  - `charCount: number` - liczba znaków w komentarzu (dla dynamicznego wyświetlenia).
- **Niestandardowe hooki:**
  - Można rozważyć stworzenie `useFeedbackForm` do zarządzania stanem formularza, walidacją i wysyłaniem danych.

### `useFeedbackForm` (Custom Hook - opcjonalnie)
- **Cel:** Abstrakcja logiki formularza, walidacji i wysyłania danych do API.
- **Stan wewnętrzny:**
  - `formData: FeedbackFormData`
  - `isLoading: boolean`
  - `error: ValidationError[] | null`
  - `successMessage: string | null`
- **Funkcje:**
  - `handleRatingChange(rating: number)`: Aktualizuje ocenę w formularzu.
  - `handleCommentChange(comment: string)`: Aktualizuje komentarz w formularzu.
  - `validateForm(): boolean`: Waliduje dane formularza (po stronie klienta).
  - `submitForm()`: Wysyła formularz do API (`POST /api/feedbacks`).
  - `resetForm()`: Czyści formularz do stanu początkowego.
- **Użycie:** Hook będzie wywoływany w `FeedbackForm` do zarządzania całą logiką.

## 7. Integracja API

### `POST /api/feedbacks`
- **Cel:** Przesłanie opinii użytkownika na serwer.
- **Miejsce wywołania:** W komponencie `FeedbackForm.tsx` lub w hooku `useFeedbackForm` po kliknięciu przycisku "Prześlij" i pomyślnej walidacji.
- **Typ żądania:** `POST`
- **URL:** `/api/feedbacks`
- **Ciało żądania:** `FeedbackRequest`
  ```json
  {
    "rating": 5,
    "comment": "Ta aplikacja jest fantastyczna!"
  }
  ```
- **Typ odpowiedzi (sukces, 201 Created):** `FeedbackResponse`
  ```json
  {
    "message": "Dziękujemy za Twoją opinię."
  }
  ```
- **Warunki:** Wymagana autentykacja (cookie sesji lub authorization header).
- **Akcja po stronie UI:**
  - Przycisk "Prześlij" staje się nieaktywny z wskaźnikiem ładowania.
  - Po pomyślnym przesłaniu wyświetlany jest toast "Dziękujemy za opinię".
  - Formularz jest czyżony do stanu początkowego.
  - Dialog zamyka się automatycznie po 1-2 sekundach.
- **Obsługa błędów:** Patrz sekcja "Obsługa błędów".

### `GET /api/feedbacks/stats` (opcjonalnie dla strony głównej)
- **Cel:** Pobranie zagregowanych statystyk opinii do wyświetlenia na stronie głównej (średnia ocena, liczba opinii).
- **Typ żądania:** `GET`
- **URL:** `/api/feedbacks/stats`
- **Typ odpowiedzi (sukces, 200 OK):** `FeedbackStatsDto`
  ```json
  {
    "averageRating": 4.75,
    "totalFeedbacks": 1234
  }
  ```
- **Warunki:** Brak autentykacji; endpoint jest publiczny.
- **Akcja po stronie UI:** Dane mogą być wyświetlane na stronie głównej (landing page) jako społeczny dowód (social proof).

## 8. Interakcje użytkownika

### Przepływ przesyłania opinii:
1. **Użytkownik widzi pływający przycisk "Prześlij opinię"** w dolnym prawym rogu ekranu.
   - Przycisk jest widoczny tylko dla zalogowanych użytkowników.
   - Dla niezalogowanych użytkowników przycisk jest ukryty lub wyłączony.

2. **Użytkownik klika przycisk "Prześlij opinię"**:
   - Otwiera się modal dialog `FeedbackDialog`.
   - Dialog wyświetla formularz z polami oceny i komentarza.

3. **Użytkownik wybiera ocenę (1-5)**:
   - Może wybrać za pomocą listy rozwijanej (`Select`) lub przycisków radiowych (`RadioGroup`).
   - Bieżąca ocena jest dynamicznie wyświetlana/podkreślana.

4. **Użytkownik (opcjonalnie) wpisuje komentarz**:
   - Pole textarea pozwala na maksymalnie 1000 znaków.
   - Dynamiczny licznik znaków wyświetla aktualną liczbę: "XXX / 1000 znaków".
   - Pole textarea ma placeholder: "Powiedz nam więcej (opcjonalnie)".

5. **Użytkownik klika "Prześlij"**:
   - Formularz jest walidowany po stronie klienta.
   - Jeśli walidacja się nie powiedzie:
     - Wyświetlane są komunikaty błędów obok odpowiednich pól.
     - Przycisk "Prześlij" pozostaje aktywny.
   - Jeśli walidacja się powiedzie:
     - Przycisk "Prześlij" staje się nieaktywny z wskaźnikiem ładowania.
     - Wysyłane jest żądanie `POST /api/feedbacks`.

6. **Serwer przetwarza opinię**:
   - Waliduje dane na backendu.
   - Zapisuje opinię w bazie danych.
   - Zwraca `201 Created` z potwierdzającym komunikatem.

7. **Po powrocie odpowiedzi**:
   - Toast "Dziękujemy za opinię" pojawia się w lewym górnym rogu.
   - Dialog zamyka się automatycznie po 1-2 sekundach.
   - Formularz powraca do stanu początkowego (gotowy do kolejnej opinii).

8. **Jeśli użytkownik klika "Anuluj"**:
   - Dialog zamyka się bez wysyłania danych.
   - Formularz powraca do stanu początkowego przy następnym otwarciu.

### Obsługa błędów:
1. **Użytkownik nie jest zalogowany**:
   - Przycisk "Prześlij opinię" jest ukryty lub wyłączony.
   - Tooltip: "Zaloguj się, aby przesłać opinię".

2. **Błąd walidacji (brak oceny)**:
   - Komunikat błędu: "Ocena jest wymagana".

3. **Błąd walidacji (komentarz zbyt długi)**:
   - Komunikat błędu: "Komentarz nie może przekraczać 1000 znaków".

4. **Błąd serwera (500)**:
   - Alert: "Nie udało się przesłać opinii. Spróbuj ponownie".
   - Przycisk "Prześlij" pozostaje aktywny.

5. **Błąd sieci**:
   - Alert: "Problem z połączeniem. Spróbuj ponownie".
   - Przycisk "Prześlij" pozostaje aktywny.

## 9. Warunki i walidacja

### Walidacja po stronie klienta:

| Pole | Warunek | Komunikat błędu |
|------|---------|-----------------|
| `rating` | Wymagane; wartość 1-5 | "Ocena jest wymagana" lub "Ocena musi być liczbą od 1 do 5" |
| `comment` | Opcjonalne; maksimum 1000 znaków | "Komentarz nie może przekraczać 1000 znaków" |
| `comment` | Nie może zawierać tylko spacji | "Komentarz nie może zawierać tylko spacji" |

### Walidacja po stronie serwera (Backend):
- Weryfikacja autentykacji (401 Unauthorized jeśli brak).
- Walidacja Zod: `rating` (integer 1-5), `comment` (string max 1000).
- Sanitacja danych (usunięcie niebezpiecznych znaków z komentarza).
- Zmapowanie `user_id` z sesji na opinię.

### Wpływ na interfejs:
- Przycisk "Prześlij" jest wyłączony, dopóki `rating` nie zostanie wybrana.
- Licznik znaków zmienia kolor (np. czerwony) jeśli użytkownik przekroczy limit.
- Komunikaty walidacji pojawiają się dynamicznie pod polami formularza.

## 10. Obsługa błędów

### Scenariusze błędów i rozwiązania:

| Scenariusz | Komunikat dla użytkownika | Akcja |
|-----------|---------------------------|-------|
| Użytkownik niezalogowany | "Zaloguj się, aby przesłać opinię" | Przycisk wyłączony/ukryty |
| Brak oceny | "Ocena jest wymagana" | Wyświetl błąd obok pola |
| Komentarz > 1000 znaków | "Komentarz nie może przekraczać 1000 znaków" | Wyświetl błąd, licznik czerwony |
| Błąd 400 (validacja) | Wiadomość z serwera (np. "Rating must be 1-5") | Wyświetl error alert, przycisk aktywny |
| Błąd 401 (brak auth) | "Sesja wygasła. Zaloguj się ponownie." | Przekieruj na login, zamknij dialog |
| Błąd 500 (serwer) | "Nie udało się przesłać opinii. Spróbuj ponownie." | Alert, przycisk aktywny |
| Błąd sieci (timeout) | "Problem z połączeniem. Spróbuj ponownie." | Alert, przycisk aktywny |

### Strategie obsługi:
- Wszystkie błędy są wyświetlane użytkownikowi w jasny, zrozumiały sposób.
- Użytkownik zawsze ma możliwość ponowienia akcji.
- Błędy walidacji pojawiają się bez zamykania dialogu (pozwala na poprawę).
- Błędy serwera wyświetlają alert z przyciskiem retry.
- Brak autentykacji powoduje przekierowanie na stronę logowania.

## 11. Kroki implementacji

1. **Definicja typów:**
   - Dodać typy do `src/types.ts`: `FeedbackFormData`, `FeedbackRequest`, `FeedbackResponse`, `FeedbackError`, itp.

2. **Stworzenie custom hooka `useFeedbackForm`:**
   - Plik: `src/components/hooks/useFeedbackForm.ts`
   - Implementować logikę: zarządzanie stanem formularza, walidacja, wysyłanie do API.
   - Funkcje: `handleRatingChange`, `handleCommentChange`, `validateForm`, `submitForm`, `resetForm`.

3. **Stworzenie komponentu `FeedbackForm.tsx`:**
   - Plik: `src/components/FeedbackForm.tsx`
   - Implementować formularz z polami oceny i komentarza.
   - Użyć hooka `useFeedbackForm` do zarządzania stanem.
   - Dodać walidację po stronie klienta.
   - Wyświetlać komunikaty błędów i sukcesu.

4. **Stworzenie komponentu `FeedbackDialog.tsx`:**
   - Plik: `src/components/FeedbackDialog.tsx`
   - Implementować modal dialog z użyciem `Dialog` z Shadcn/ui.
   - Renderować `FeedbackForm` wewnątrz dialogu.
   - Obsługiwać otwieranie/zamykanie dialogu.

5. **Stworzenie komponentu `FeedbackButton.tsx`:**
   - Plik: `src/components/FeedbackButton.tsx`
   - Implementować pływający przycisk w dolnym prawym rogu.
   - Kontrolować widoczność dla zalogowanych użytkowników.
   - Otwierać `FeedbackDialog` po kliknięciu.

6. **Integracja do `Layout.astro`:**
   - Dodać `<FeedbackButton client:only="react" />` do szablonu głównego.
   - Zapewnić, że komponent jest załadowany na wszystkich stronach.

7. **Testy jednostkowe:**
   - Testy dla `useFeedbackForm` - walidacja, wysyłanie, obsługa błędów.
   - Testy dla `FeedbackForm` - renderowanie, interakcje, walidacja.
   - Testy dla `FeedbackButton` - widoczność dla zalogowanych/niezalogowanych.

8. **Stylowanie:**
   - Użyć Tailwind CSS do ostylowania komponentów.
   - Zapewnić responsywność (przycisk powinien być widoczny na mobile).
   - Dodać efekty hover, focus-visible dla dostępności.

9. **Obsługa dostępności (A11y):**
   - Dodać ARIA labels dla wszystkich interaktywnych elementów.
   - Zapewnić, że dialog jest fokusowalny i zamykalny klawiszem Escape.
   - Wyświetlać komunikaty błędów z rolą `alert`.

10. **Integracja z systemem powiadomień:**
    - Użyć istniejącego systemu toast do wyświetlania komunikatów sukcesu/błędu.
    - Upewnić się, że toast pojawiają się w dostępny sposób dla screen readerów.

11. **Testy integracyjne:**
    - Przetestować cały przepływ: otwarcie dialogu → wybór oceny → wpisanie komentarza → przesłanie → zamknięcie dialogu.
    - Przetestować obsługę błędów (brak auth, błąd serwera, itp.).
    - Przetestować widoczność dla zalogowanych/niezalogowanych użytkowników.

12. **Dokumentacja:**
    - Dodać dokumentację komponentów w sekcji "Komponenty" w dokumentacji projektu.
    - Opisać props, eventy i use cases dla każdego komponentu.

