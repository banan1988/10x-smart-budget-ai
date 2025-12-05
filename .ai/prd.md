Jasne, oto finalna wersja założeń do dokumentu wymagań projektowych (PRD) dla MVP aplikacji SmartBudgetAI, stworzona na podstawie naszej rozmowy.

---

### **Dokument Wymagań Projektowych (PRD): SmartBudgetAI (MVP)**

#### **1. Problem i Wizja Produktu**

*   **Problem:** Użytkownicy mają trudności ze śledzeniem swoich finansów, ponieważ ręczne kategoryzowanie wydatków w istniejących aplikacjach jest czasochłonne i zniechęcające.
*   **Wizja:** Stworzenie prostej w obsłudze aplikacji webowej, która automatyzuje proces kategoryzacji wydatków przy użyciu AI, dostarczając użytkownikom klarownych informacji o ich nawykach finansowych.

#### **2. Kluczowe Funkcjonalności (Zakres MVP)**

**2.1. Zarządzanie Kontem Użytkownika**
*   **Rejestracja:** Formularz z polami: `email`, `hasło`, `potwierdź hasło`.
*   **Logowanie:** Formularz z polami: `email`, `hasło`.
*   **Usuwanie Konta:** Dostępny w stopce link "Usuń konto", który po potwierdzeniu trwale usuwa użytkownika i wszystkie jego dane (zgodność z RODO).
*   **Technologia:** Autentykacja realizowana przy użyciu Supabase (Email/Password provider).

**2.2. Zarządzanie Transakcjami (CRUD)**
*   **Typy Transakcji:** Aplikacja obsługuje dwa typy transakcji: **przychody** (income) i **wydatki** (expense).
*   **Dodawanie:**
    *   Uruchamiane przez przycisk "Dodaj transakcję" na głównym ekranie.
    *   Interfejs w formie okna modalnego (pop-up) z możliwością wyboru typu transakcji.
    *   Pola formularza: `typ` (przychód/wydatek), `kwota` (PLN), `opis`, `data` (domyślnie ustawiona na bieżący dzień).
    *   Przyciski akcji: "Zapisz" (zapisuje i zamyka okno) oraz "Zapisz i dodaj kolejną" (zapisuje i czyści formularz do ponownego użycia).
*   **Wyświetlanie:**
    *   Lista transakcji na głównym ekranie, domyślnie dla bieżącego miesiąca, z wyraźnym oznaczeniem przychodów i wydatków.
    *   Prosta nawigacja za pomocą przycisków "< Poprzedni miesiąc" i "Następny miesiąc >".
*   **Edycja:** Użytkownik może edytować wszystkie pola istniejącej transakcji (`typ`, `kwota`, `opis`, `data`).
*   **Usuwanie:** Użytkownik może usunąć pojedynczą transakcję.
**2.3. Kategoryzacja AI (tylko dla wydatków)**
*   **Automatyzacja:** Po dodaniu transakcji typu **wydatek**, jej `opis` jest wysyłany do modelu AI w celu przypisania kategorii. Transakcje typu **przychód** nie podlegają kategoryzacji.
*   **Źródło Kategorii:** AI wybiera kategorię z predefiniowanej, globalnej listy (`categories`), operując na unikalnym, tekstowym kluczu (np. 'food', 'transport').
*   **Format Odpowiedzi AI:** AI zwraca `key` kategorii (np. "food"). Aplikacja jest odpowiedzialna za znalezienie odpowiedniego `id` kategorii na podstawie tego klucza.
*   **Obsługa Błędów:** W przypadku, gdy AI nie zwróci poprawnego `key` kategorii, transakcji automatycznie przypisywana jest kategoria "Inne".

**2.4. Pulpit Główny (Dashboard)**
*   **Podsumowanie Finansowe:** Wyświetlanie kluczowych wartości: `Przychody`, `Wydatki` oraz `Bilans` (Przychody - Wydatki).
*   **Domyślny Widok:** Pierwszy ekran po zalogowaniu, prezentujący dane dla bieżącego miesiąca.
*   **Wykres Wydatków:** Prosty wykres słupkowy pokazujący 5 kategorii z najwyższymi sumami wydatków oraz jeden słupek "Inne" agregujący pozostałe.
*   **Podsumowanie AI:** Krótkie, tekstowe podsumowanie wydatków wygenerowane przez AI, opisujące główne trendy finansowe użytkownika.
*   **Stan Pusty (Empty State):** Jeśli w danym miesiącu nie ma transakcji, wyświetlany jest komunikat zachęcający do dodania pierwszej z nich.
*   **Źródło Danych:** Dashboard pobiera wszystkie dane (przychody, wydatki, bilans, rozbicie po kategoriach, podsumowanie AI) z jednego endpointu `/api/transactions/stats?month=YYYY-MM&includeAiSummary=true`.

**2.5. Zbieranie Opinii**
*   **Mechanizm:** Prosty pop-up z pytaniem "Jak oceniasz przydatność aplikacji w skali od 1 do 5?" oraz opcjonalnym polem na komentarz.

#### **3. Wymagania Niefunkcjonalne i Techniczne**

*   **Waluta:** Aplikacja obsługuje wyłącznie jedną walutę: Polski Złoty (PLN). Kwoty w bazie danych są przechowywane jako `integer` (liczba groszy).
*   **Język:** Interfejs użytkownika jest w języku polskim. Teksty są przechowywane w dedykowanym pliku (np. `pl.json`), aby ułatwić przyszłą internacjonalizację (i18n).
*   **Obsługa Błędów:** Aplikacja posiada globalny system powiadomień (typu "toast"/"snackbar") informujący użytkownika o powodzeniu lub niepowodzeniu operacji (np. dodawania transakcji).
*   **Struktura Bazy Danych (Supabase):**
    *   `users`: Zarządzana przez Supabase Auth.
    *   `user_profiles`: Rozszerzenie tabeli `users` o dodatkowe dane (np. `nickname`, `preferences`).
    *   `transactions`: Zawiera m.in. `id`, `user_id`, `type` ('income'/'expense'), `category_id` (nullable dla przychodów), `amount` (integer), `description`, `date`, `is_ai_categorized` (boolean, domyślnie `false`).
    *   `categories`: Tabela globalna zawierająca `id` (BIGSERIAL), `key` (unikalny klucz tekstowy dla AI, np. 'food') oraz `translations` (JSONB z tłumaczeniami, np. `{"pl": "Jedzenie"}`).
*   **Integracja z AI (dla wydatków):**
    *   Do AI przekazywany jest `opis` transakcji.
    *   Prompt systemowy zawiera instrukcje dla AI oraz listę dostępnych kategorii w formacie `[{"key": "food"}, {"key": "transport"}, ...]`.
    *   AI zwraca `key` wybranej kategorii. Aplikacja na tej podstawie przypisuje odpowiednie `category_id` do transakcji.

#### **4. Kryteria Sukcesu i Sposób Pomiaru**

*   **Skuteczność AI:** Cel: 80% wydatków jest poprawnie skategoryzowanych przez AI.
    *   **Pomiar:** Obliczany na podstawie flagi `is_ai_categorized`. Ręczna zmiana kategorii przez użytkownika będzie wymagała aktualizacji tej flagi w logice aplikacji. Wskaźnik = `(liczba transakcji z is_ai_categorized = true i niepoprawionych / łączna liczba transakcji) * 100%`.
*   **Użyteczność Aplikacji:** Cel: 50% użytkowników uważa aplikację za użyteczną i pomocną.
    *   **Pomiar:** Na podstawie odpowiedzi na pytanie w skali 1-5. Użytkownicy, którzy ocenili aplikację na 4 lub 5, są uznawani za zadowolonych.

---

#### **5. Bezpieczeństwo i Kontrola Dostępu**

##### **5.1. Bezpieczny dostęp i uwierzytelnianie**
*   **Tytuł:** Bezpieczny dostęp i uwierzytelnianie
*   **Opis:** Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych, a także możliwość odzyskania dostępu do konta w przypadku zapomnienia hasła.
*   **Kryteria akceptacji:**
    *   Logowanie i rejestracja odbywają się na dedykowanych stronach (`/login`, `/register`).
    *   Rejestracja wymaga podania adresu email, hasła i jego potwierdzenia.
    *   Logowanie wymaga podania adresu email i hasła.
    *   Aplikacja NIE zezwala na dostęp do żadnych funkcjonalności (poza stroną logowania/rejestracji) bez aktywnej sesji użytkownika.
    *   Użytkownik może się wylogować z systemu.
    *   Implementacja wykorzystuje wyłącznie wewnętrzny system uwierzytelniania Supabase (email/hasło), bez zewnętrznych dostawców (Google, GitHub itp.).
    *   Użytkownik ma możliwość zresetowania zapomnianego hasła poprzez wysłanie linku resetującego na jego adres email.

##### **5.2. Autoryzacja i izolacja danych (Row Level Security)**
*   **Tytuł:** Ochrona i izolacja danych użytkownika
*   **Opis:** Jako użytkownik chcę mieć pewność, że tylko ja mam dostęp do moich danych finansowych, a system chroni je przed nieautoryzowanym dostępem.
*   **Kryteria akceptacji:**
    *   Polityki Row Level Security (RLS) w Supabase są włączone i poprawnie skonfigurowane dla wszystkich tabel przechowujących dane użytkowników (np. `transactions`, `user_profiles`).
    *   Każde zapytanie do bazy danych po stronie serwera musi być wykonane w kontekście zalogowanego użytkownika, aby RLS mogło poprawnie filtrować dane.
    *   Użytkownik A nie może w żaden sposób odczytać, modyfikować ani usuwać danych należących do użytkownika B.
    *   Wszystkie endpointy API (poza `/api/auth/login`, `/api/auth/register`, `/api/auth/callback`) są chronione i wymagają ważnego tokenu sesji.
    *   Próba dostępu do chronionego zasobu bez uwierzytelnienia zwraca błąd `401 Unauthorized`.

---

#### **6. Role i Uprawnienia**

##### **6.1. Role Użytkowników**

Aplikacja rozróżnia dwie główne role użytkowników: `user` oraz `admin`.

*   **user:** Zwykły użytkownik aplikacji, mający dostęp do podstawowych funkcji zarządzania finansami.
*   **admin:** Użytkownik z uprawnieniami administracyjnymi, mający dostęp do dodatkowych funkcji zarządzania i analityki.

##### **6.2. Uprawnienia według Ról**

| Funkcjonalność                        | Rola `user` | Rola `admin` |
| ------------------------------------- | ----------- | ------------ |
| Rejestracja i logowanie              | Tak         | Tak          |
| Zarządzanie własnym profilem         | Tak         | Tak          |
| Przeglądanie i dodawanie transakcji  | Tak         | Tak          |
| Edytowanie i usuwanie transakcji     | Tak         | Tak          |
| Przeglądanie statystyk finansowych   | Tak         | Tak          |
| Kategoryzacja wydatków przez AI      | Tak         | Tak          |
| Dostęp do pulpitu głównego           | Tak         | Tak          |
| Resetowanie hasła                    | Tak         | Tak          |
| Dostęp do panelu administracyjnego   | Nie         | Tak          |
| Zarządzanie użytkownikami            | Nie         | Tak          |
| Przeglądanie wszystkich transakcji    | Nie         | Tak          |
| Przeglądanie i usuwanie opinii       | Nie         | Tak          |

##### **6.3. Przypisywanie Ról**

*   Rola `user` jest przypisywana automatycznie podczas rejestracji.
*   Rola `admin` może być przypisana tylko przez innego administratora lub podczas importu użytkowników (np. z pliku CSV).
*   Zwykły użytkownik nie widzi w interfejsie żadnych linków ani elementów prowadzących do panelu administracyjnego.
*   Rola użytkownika jest przechowywana w bezpieczny sposób (np. w dedykowanej tabeli lub w `app_metadata` w Supabase Auth) i nie może być modyfikowana przez użytkownika.

#### **7. Wymagania Dostępu (Authentication & Authorization)**

Poniższa sekcja precyzuje wymagania dotyczące dostępu do poszczególnych widoków (stron) i endpointów API w aplikacji.

##### **7.1. Dostęp do Widoków (Stron)**

| Ścieżka (Path)                | Wymagany Dostęp      | Wymagana Rola | Opis                                                 |
| ----------------------------- | -------------------- | ------------- | ---------------------------------------------------- |
| `/`                           | Publiczny            | -             | Strona główna (landing page)                         |
| `/login`                      | Publiczny            | -             | Formularz logowania                                  |
| `/register`                   | Publiczny            | -             | Formularz rejestracji                                |
| `/forgot-password`            | Publiczny            | -             | Formularz inicjujący reset hasła                     |
| `/dashboard`                  | **Uwierzytelniony**  | `user`        | Główny pulpit użytkownika                            |
| `/transactions`               | **Uwierzytelniony**  | `user`        | Widok listy transakcji                               |
| `/profile`                    | **Uwierzytelniony**  | `user`        | Ustawienia profilu użytkownika                       |
| `/profile/reset-password`     | **Uwierzytelniony**  | `user`        | Formularz zmiany hasła po kliknięciu w link          |
| `/admin/**`                   | **Uwierzytelniony**  | `admin`       | Wszystkie strony w panelu administracyjnym           |

##### **7.2. Dostęp do API Endpoints**

| Endpoint (Metoda i Ścieżka)         | Wymagany Dostęp      | Wymagana Rola | Opis                                                 |
| ----------------------------------- | -------------------- | ------------- | ---------------------------------------------------- |
| `POST /api/auth/login`              | Publiczny            | -             | Logowanie użytkownika                                |
| `POST /api/auth/register`           | Publiczny            | -             | Rejestracja nowego użytkownika                       |
| `POST /api/auth/logout`             | **Uwierzytelniony**  | `user`        | Wylogowanie użytkownika                              |
| `GET /api/auth/callback`            | Publiczny            | -             | Callback dla Supabase Auth (np. po potwierdzeniu email) |
| `POST /api/auth/forgot-password`    | Publiczny            | -             | Wysłanie linku do resetu hasła                       |
| `POST /api/auth/reset-password`     | **Uwierzytelniony**  | `user`        | Aktualizacja hasła użytkownika (wymaga sesji z tokenu) |
| `GET /api/transactions`             | **Uwierzytelniony**  | `user`        | Pobieranie listy transakcji użytkownika              |
| `POST /api/transactions`            | **Uwierzytelniony**  | `user`        | Dodawanie nowej transakcji                           |
| `PUT /api/transactions/{id}`        | **Uwierzytelniony**  | `user`        | Aktualizacja transakcji                              |
| `DELETE /api/transactions/{id}`     | **Uwierzytelniony**  | `user`        | Usuwanie transakcji                                  |
| `GET /api/transactions/stats`       | **Uwierzytelniony**  | `user`        | Pobieranie statystyk finansowych użytkownika         |
| `GET /api/transactions/summary`     | **Uwierzytelniony**  | `user`        | Pobieranie podsumowania AI dla użytkownika           |
| `GET /api/categories`               | **Uwierzytelniony**  | `user`        | Pobieranie listy dostępnych kategorii                |
| `GET /api/user/profile`             | **Uwierzytelniony**  | `user`        | Pobieranie profilu użytkownika                       |
| `PUT /api/user/profile`             | **Uwierzytelniony**  | `user`        | Aktualizacja profilu użytkownika                     |
| `DELETE /api/user/account`          | **Uwierzytelniony**  | `user`        | Usunięcie konta użytkownika (wymaga potwierdzenia)   |
| `POST /api/feedback`                | **Uwierzytelniony**  | `user`        | Wysłanie opinii o aplikacji                          |
| `GET /api/admin/**`                 | **Uwierzytelniony**  | `admin`       | Wszystkie endpointy do zarządzania i analityki       |
| `DELETE /api/admin/feedbacks/{id}`  | **Uwierzytelniony**  | `admin`       | Usunięcie opinii przez administratora                |
