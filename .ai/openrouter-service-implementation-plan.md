# Plan Wdrożenia Usługi OpenRouter

## 1. Opis Usługi

`OpenRouterService` to usługa po stronie serwera, zaprojektowana do interakcji z API OpenRouter w celu uzyskiwania uzupełnień od modeli językowych (LLM). Umożliwia wysyłanie zapytań do różnych modeli, w tym konfigurowanie komunikatów systemowych, parametrów modelu oraz wymuszanie ustrukturyzowanych odpowiedzi w formacie JSON. Usługa będzie działać w środowisku Astro jako część backendu aplikacji.

## 2. Opis Konstruktora

Konstruktor `OpenRouterService` inicjalizuje usługę, sprawdzając dostępność klucza API OpenRouter w zmiennych środowiskowych.

```typescript
// src/lib/services/OpenRouterService.ts

import { z } from 'zod';

// Schematy Zod dla walidacji
const OpenRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    })
  ),
});

const JsonSchema = z.object({
  name: z.string(),
  strict: z.boolean().optional(),
  schema: z.record(z.any()),
});

const ResponseFormat = z.object({
  type: z.literal('json_schema'),
  json_schema: JsonSchema,
});

export class OpenRouterService {
  private apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // TODO: Implement proper logging
      console.error('OpenRouter API key is not configured.');
      throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }
    this.apiKey = apiKey;
  }

  // ... metody publiczne i prywatne
}
```

## 3. Publiczne Metody i Pola

### `async getChatCompletion<T>(options: ChatCompletionOptions): Promise<T>`

Główna metoda publiczna do uzyskiwania uzupełnień z API OpenRouter.

- **`options`**: Obiekt konfiguracyjny `ChatCompletionOptions`.
- **Zwraca**: `Promise<T>`, gdzie `T` to typ oczekiwanej, sparsowanej odpowiedzi JSON.

**Typ `ChatCompletionOptions`:**

```typescript
// src/lib/services/OpenRouterService.ts

export interface ChatCompletionOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseFormat: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict?: boolean;
      schema: object;
    };
  };
  temperature?: number;
  maxTokens?: number;
}
```

## 4. Prywatne Metody i Pola

### `private async makeRequest<T>(body: object): Promise<T>`

Prywatna metoda do wykonywania zapytań `fetch` do API OpenRouter.

- **`body`**: Obiekt zawierający payload zapytania.
- **Zwraca**: `Promise<T>` z odpowiedzią API.

### Pola Prywatne

- **`apiKey: string`**: Przechowuje klucz API OpenRouter.
- **`baseUrl: string`**: Stały adres URL bazowego API OpenRouter.

## 5. Obsługa Błędów

Usługa będzie implementować kompleksową obsługę błędów, obejmującą:
1.  **Błędy Konfiguracji**: Rzucenie wyjątku w konstruktorze, jeśli brakuje `OPENROUTER_API_KEY`.
2.  **Błędy Sieciowe**: Obsługa błędów `fetch` (np. problemy z połączeniem) za pomocą bloków `try...catch`.
3.  **Błędy API OpenRouter**: Sprawdzanie statusu odpowiedzi HTTP. Jeśli odpowiedź nie jest `ok` (status 2xx), treść błędu zostanie odczytana, zalogowana, a następnie zostanie rzucony odpowiedni wyjątek.
4.  **Błędy Walidacji (Zod)**: Odpowiedź z API będzie walidowana przy użyciu `OpenRouterResponseSchema`. W przypadku niepowodzenia walidacji, błąd zostanie zalogowany, a wyjątek rzucony.
5.  **Błędy Parsowania JSON**: Obsługa błędów podczas parsowania odpowiedzi z modelu, jeśli nie jest ona zgodna z oczekiwanym schematem JSON.

## 6. Kwestie Bezpieczeństwa

1.  **Zarządzanie Kluczem API**: Klucz API będzie przechowywany wyłącznie w zmiennych środowiskowych po stronie serwera (`.env`) i nigdy nie będzie eksponowany po stronie klienta. Plik `.env` musi być dodany do `.gitignore`.
2.  **Walidacja Danych Wejściowych**: Chociaż usługa jest wewnętrzna, wszystkie dane wejściowe (np. `userPrompt`) powinny być traktowane jako potencjalnie niezaufane. W przyszłości można rozważyć implementację mechanizmów sanitarnych.
3.  **Ograniczenie Dostępu**: Usługa powinna być wywoływana tylko z zaufanych części aplikacji (np. endpointy API Astro), które implementują własne mechanizmy autoryzacji i uwierzytelniania (np. oparte o Supabase).

## 7. Plan Wdrożenia Krok po Kroku

1.  **Konfiguracja Środowiska**:
    *   Utwórz plik `.env` w głównym katalogu projektu.
    *   Dodaj do niego zmienną `OPENROUTER_API_KEY=twoj_klucz_api`.
    *   Upewnij się, że `.env` jest dodany do pliku `.gitignore`.

2.  **Utworzenie Pliku Usługi**:
    *   Stwórz nowy plik: `src/lib/services/OpenRouterService.ts`.

3.  **Implementacja Konstruktora i Typów**:
    *   Dodaj kod konstruktora, import `zod` oraz definicje typów (`ChatCompletionOptions`) i schematów Zod, jak pokazano w sekcji 2 i 3.

4.  **Implementacja Metody `getChatCompletion`**:
    *   Zaimplementuj metodę publiczną, która przyjmuje `options` i buduje payload dla API.

    ```typescript
    // wewnątrz klasy OpenRouterService
    
    public async getChatCompletion<T>(options: ChatCompletionOptions): Promise<T> {
      const { model, systemPrompt, userPrompt, responseFormat, temperature, maxTokens } = options;

      const payload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: responseFormat,
        temperature,
        max_tokens: maxTokens,
      };

      const response = await this.makeRequest<{ choices: { message: { content: string } }[] }>(payload);
      
      const content = response.choices[0].message.content;
      
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        // TODO: Lepsze logowanie
        console.error('Failed to parse JSON response from model:', content);
        throw new Error('Invalid JSON response from model.');
      }
    }
    ```

5.  **Implementacja Metody `makeRequest`**:
    *   Dodaj prywatną metodę do obsługi komunikacji z API, włączając w to obsługę błędów.

    ```typescript
    // wewnątrz klasy OpenRouterService

    private async makeRequest<T>(body: object): Promise<T> {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        // TODO: Lepsze logowanie
        console.error(`OpenRouter API error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Walidacja podstawowej struktury odpowiedzi
      const validation = OpenRouterResponseSchema.safeParse(data);
      if (!validation.success) {
        // TODO: Lepsze logowanie
        console.error('Invalid response structure from OpenRouter API:', validation.error);
        throw new Error('Invalid response structure from API.');
      }

      return validation.data as T;
    }
    ```

6.  **Przykład Użycia w Endpoincie API Astro**:
    *   Utwórz lub zmodyfikuj endpoint API, np. `src/pages/api/categorize.ts`, aby użyć nowej usługi.

    ```typescript
    // src/pages/api/categorize.ts (przykład)
    import type { APIRoute } from 'astro';
    import { z } from 'zod';
    import { OpenRouterService } from '../../lib/services/OpenRouterService';

    export const prerender = false;

    const RequestBodySchema = z.object({
      transactionName: z.string(),
    });

    const CategorySchema = {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'The suggested category for the transaction.' },
        confidence: { type: 'number', description: 'A confidence score between 0 and 1.' },
      },
      required: ['category', 'confidence'],
    };

    export const POST: APIRoute = async ({ request }) => {
      // Walidacja ciała żądania
      const body = await request.json();
      const validation = RequestBodySchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
      }
      
      const { transactionName } = validation.data;

      try {
        const openRouterService = new OpenRouterService();
        const result = await openRouterService.getChatCompletion<{ category: string; confidence: number }>({
          model: 'anthropic/claude-3.5-sonnet',
          systemPrompt: 'You are an expert in personal finance. Your task is to categorize a transaction based on its name. Respond with a JSON object.',
          userPrompt: `Categorize the following transaction: "${transactionName}"`,
          responseFormat: {
            type: 'json_schema',
            json_schema: {
              name: 'transactionCategory',
              strict: true,
              schema: CategorySchema,
            },
          },
          temperature: 0.2,
        });

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        // TODO: Lepsze logowanie
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
      }
    };
    ```

7.  **Testowanie**:
    *   Utwórz plik testowy `src/lib/services/OpenRouterService.test.ts`.
    *   Napisz testy jednostkowe dla `OpenRouterService`, mockując `fetch` oraz zmienne środowiskowe, aby przetestować logikę budowania zapytań i obsługi odpowiedzi.
    *   Napisz testy integracyjne dla endpointu API (`src/pages/api/categorize.test.ts`), aby zweryfikować całościowe działanie.

