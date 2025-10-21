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
*   **Dodawanie:**
    *   Uruchamiane przez przycisk "Dodaj transakcję" na głównym ekranie.
    *   Interfejs w formie okna modalnego (pop-up).
    *   Pola formularza: `kwota` (PLN), `opis`, `data` (domyślnie ustawiona na bieżący dzień).
    *   Przyciski akcji: "Zapisz" (zapisuje i zamyka okno) oraz "Zapisz i dodaj kolejną" (zapisuje i czyści formularz do ponownego użycia).
*   **Wyświetlanie:**
    *   Lista transakcji na głównym ekranie, domyślnie dla bieżącego miesiąca.
    *   Prosta nawigacja za pomocą przycisków "< Poprzedni miesiąc" i "Następny miesiąc >".
*   **Edycja:** Użytkownik może edytować wszystkie pola istniejącej transakcji (`kwota`, `opis`, `data`).
*   **Usuwanie:** Użytkownik może usunąć pojedynczą transakcję.

**2.3. Kategoryzacja AI**
*   **Automatyzacja:** Po dodaniu transakcji, jej `opis` jest wysyłany do modelu AI w celu przypisania kategorii.
*   **Źródło Kategorii:** AI wybiera kategorię z predefiniowanej, globalnej listy przechowywanej w tabeli `categories` w bazie danych.
*   **Format Odpowiedzi AI:** AI zwraca unikalny identyfikator (`id`) kategorii, a nie jej nazwę.
*   **Obsługa Błędów:** W przypadku, gdy AI nie zwróci poprawnego `id` kategorii, transakcji automatycznie przypisywana jest kategoria "Inne".

**2.4. Pulpit Główny (Dashboard)**
*   **Domyślny Widok:** Pierwszy ekran po zalogowaniu, prezentujący dane dla bieżącego miesiąca.
*   **Wykres Wydatków:** Prosty wykres słupkowy pokazujący 5 kategorii z najwyższymi sumami wydatków oraz jeden słupek "Inne" agregujący pozostałe.
*   **Podsumowanie AI:** Krótki (2-3 zdania) opis wydatków z ostatniego miesiąca w języku naturalnym, generowany przez AI.
*   **Stan Pusty (Empty State):** Jeśli w danym miesiącu nie ma transakcji, wyświetlany jest komunikat zachęcający do dodania pierwszej z nich.

**2.5. Zbieranie Opinii**
*   **Mechanizm:** Prosty pop-up z pytaniem "Jak oceniasz przydatność aplikacji w skali od 1 do 5?" oraz opcjonalnym polem na komentarz.

#### **3. Wymagania Niefunkcjonalne i Techniczne**

*   **Waluta:** Aplikacja obsługuje wyłącznie jedną walutę: Polski Złoty (PLN). Kwoty w bazie danych są przechowywane jako `integer` (liczba groszy).
*   **Język:** Interfejs użytkownika jest w języku polskim. Teksty są przechowywane w dedykowanym pliku (np. `pl.json`), aby ułatwić przyszłą internacjonalizację (i18n).
*   **Obsługa Błędów:** Aplikacja posiada globalny system powiadomień (typu "toast"/"snackbar") informujący użytkownika o powodzeniu lub niepowodzeniu operacji (np. dodawania transakcji).
*   **Struktura Bazy Danych (Supabase):**
    *   `users`: Zarządzana przez Supabase Auth.
    *   `transactions`: Zawiera m.in. `id`, `user_id`, `category_id`, `amount` (integer), `description`, `date`, `ai_category_corrected` (boolean).
    *   `categories`: Zawiera `id` (unikalny identyfikator tekstowy) oraz `name` (nazwa widoczna dla użytkownika). Kategorie są globalne dla wszystkich użytkowników.
*   **Integracja z AI:**
    *   Do AI przekazywany jest tylko `opis` transakcji.
    *   Prompt systemowy zawiera instrukcje dla AI oraz listę dostępnych kategorii w formacie JSON `[{"id": "...", "name": "..."}, ...]`.

#### **4. Kryteria Sukcesu i Sposób Pomiaru**

*   **Skuteczność AI:** Cel: 80% wydatków jest poprawnie skategoryzowanych przez AI.
    *   **Pomiar:** Obliczany na podstawie flagi `ai_category_corrected`. Każda ręczna zmiana kategorii przez użytkownika ustawia tę flagę na `true`. Wskaźnik = `(liczba transakcji z flagą false / łączna liczba transakcji) * 100%`.
*   **Użyteczność Aplikacji:** Cel: 50% użytkowników uważa aplikację za użyteczną i pomocną.
    *   **Pomiar:** Na podstawie odpowiedzi na pytanie w skali 1-5. Użytkownicy, którzy ocenili aplikację na 4 lub 5, są uznawani za zadowolonych.