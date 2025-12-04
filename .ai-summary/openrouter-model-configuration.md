# Konfiguracja Modelu OpenRouter

## Jak zmienić model?

### 1. Edytuj plik `.env`

```bash
# W pliku .env
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

### 2. Restart aplikacji

Po zmianie zmiennej środowiskowej, zrestartuj serwer deweloperski.

---

## Zalecane Modele

### 🆓 Darmowe Modele (Recommended dla development)

#### ⭐ **Llama 3.2 3B Instruct** (ZALECANY)
```
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```
- **Koszt**: $0 (darmowy)
- **Jakość**: Bardzo dobra dla structured output
- **Szybkość**: Wysoka
- **Context**: 128k tokens
- **Ograniczenia**: 20 requests/minute
- **Użycie**: ✅ Idealny na początek!

#### Llama 3.2 1B Instruct
```
OPENROUTER_MODEL=meta-llama/llama-3.2-1b-instruct:free
```
- **Koszt**: $0 (darmowy)
- **Jakość**: Dobra (niższa niż 3B)
- **Szybkość**: Bardzo wysoka
- **Context**: 128k tokens
- **Użycie**: Jeśli potrzebujesz bardzo szybkich odpowiedzi

#### Google Gemini 2.0 Flash
```
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```
- **Koszt**: $0 (darmowy w wersji experimental)
- **Jakość**: Bardzo dobra
- **Szybkość**: Wysoka
- **Context**: 1M tokens (!)
- **Użycie**: Alternatywa dla Llama

---

### 💰 Płatne Modele (Recommended dla production)

#### ⭐ **GPT-4o Mini** (NAJLEPSZY STOSUNEK CENY DO JAKOŚCI)
```
OPENROUTER_MODEL=openai/gpt-4o-mini
```
- **Koszt**: $0.15 input / $0.60 output per 1M tokens
- **Jakość**: Bardzo dobra
- **Szybkość**: Wysoka
- **Context**: 128k tokens
- **Koszt typowej kategoryzacji**: ~$0.00006 (0.006 centa)
- **Użycie**: ✅ Najlepszy wybór dla production

#### Claude 3.5 Sonnet
```
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
- **Koszt**: $3.00 input / $15.00 output per 1M tokens
- **Jakość**: Najwyższa
- **Szybkość**: Średnia
- **Context**: 200k tokens
- **Koszt typowej kategoryzacji**: ~$0.0012 (0.12 centa)
- **Użycie**: Gdy potrzebujesz najwyższej jakości

#### Claude 3.5 Haiku
```
OPENROUTER_MODEL=anthropic/claude-3.5-haiku
```
- **Koszt**: $0.80 input / $4.00 output per 1M tokens
- **Jakość**: Bardzo dobra
- **Szybkość**: Bardzo wysoka
- **Context**: 200k tokens
- **Koszt typowej kategoryzacji**: ~$0.00032 (0.032 centa)
- **Użycie**: Dobra alternatywa dla GPT-4o Mini

#### GPT-4o
```
OPENROUTER_MODEL=openai/gpt-4o
```
- **Koszt**: $2.50 input / $10.00 output per 1M tokens
- **Jakość**: Bardzo wysoka
- **Szybkość**: Średnia
- **Context**: 128k tokens
- **Koszt typowej kategoryzacji**: ~$0.001 (0.1 centa)
- **Użycie**: Premium opcja

---

## Szacowanie Kosztów

### Przykładowa Kategoryzacja

**Typowy request (200 tokens):**
```
System Prompt: ~150 tokens
User Prompt: ~20 tokens
Response: ~30 tokens
TOTAL: ~200 tokens
```

### Koszty dla 10,000 kategoryzacji/miesiąc:

| Model | Koszt/miesiąc | Koszt/kategoryzacja |
|-------|---------------|---------------------|
| Llama 3.2 3B (free) | **$0** | $0 |
| GPT-4o Mini | **$1.50** | $0.00015 |
| Claude 3.5 Haiku | $3.60 | $0.00036 |
| GPT-4o | $12.50 | $0.00125 |
| Claude 3.5 Sonnet | $36.00 | $0.0036 |

---

## Strategia Rekomendowana

### Development
```bash
# .env.development
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```
✅ Darmowy, dobra jakość, wystarczająca szybkość

### Production (Małe/Średnie obciążenie)
```bash
# .env.production
OPENROUTER_MODEL=openai/gpt-4o-mini
```
✅ Najlepszy stosunek ceny do jakości (~$1.50/10k kategoryzacji)

### Production (Duże obciążenie + wymagana jakość)
```bash
# .env.production
OPENROUTER_MODEL=anthropic/claude-3.5-haiku
```
✅ Szybki, dobra jakość, rozsądna cena

### Production (Krytyczna jakość)
```bash
# .env.production
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
✅ Najwyższa jakość, wyższa cena

---

## Testowanie Różnych Modeli

### Zmień model w `.env`:
```bash
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

### Przetestuj kategoryzację:
```typescript
const service = new AiCategorizationService();

const testCases = [
  'Coffee at Starbucks',
  'Uber ride to airport',
  'Netflix subscription',
  'Tesco grocery shopping',
];

for (const description of testCases) {
  const result = await service.categorizeTransaction(description);
  console.log(`${description}:`);
  console.log(`  Category: ${result.categoryKey}`);
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Reasoning: ${result.reasoning}\n`);
}
```

### Porównaj wyniki różnych modeli:
1. Jakość kategoryzacji (accuracy)
2. Confidence scores
3. Reasoning quality
4. Szybkość odpowiedzi
5. Koszt

---

## FAQ

**Q: Który model wybrać na start?**  
A: `meta-llama/llama-3.2-3b-instruct:free` - darmowy i wystarczająco dobry.

**Q: Czy mogę używać różnych modeli dla różnych użytkowników?**  
A: Obecnie nie, ale można to zaimplementować przekazując model jako parametr do serwisu.

**Q: Czy darmowe modele mają limity?**  
A: Tak, zazwyczaj ~20 requests/minute. Dla większego ruchu użyj płatnego modelu.

**Q: Jak monitorować koszty?**  
A: OpenRouter dashboard pokazuje usage. Możesz też dodać własny monitoring w kodzie.

**Q: Co jeśli model zwróci złą kategorię?**  
A: Użytkownik może poprawić + zapisz feedback. W przyszłości można użyć tego do fine-tuningu.

**Q: Czy mogę użyć lokalnego modelu?**  
A: Tak, możesz skonfigurować własny endpoint, ale OpenRouter jest wygodniejszy.

---

## Przykład: Zmiana Modelu

### 1. Development → Production

**Przed (development):**
```bash
# .env
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

**Po (production):**
```bash
# .env
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### 2. Restart aplikacji

```bash
npm run dev  # development
# lub
npm run build && npm start  # production
```

### 3. Verify w logach

Sprawdź że aplikacja używa nowego modelu:
```
[AiCategorizationService] Using model: openai/gpt-4o-mini
```

---

## Monitoring Kosztów

### TODO: Implementacja
```typescript
// Dodaj do AiCategorizationService
private logUsage(model: string, tokens: number) {
  // Log do analytics
  // Aktualizuj licznik kosztów
  // Alert gdy przekroczony budżet
}
```

---

**Rekomendacja Finalna**:
- **Start**: `meta-llama/llama-3.2-3b-instruct:free` (darmowy)
- **Production**: `openai/gpt-4o-mini` (najlepszy stosunek ceny do jakości)
- **Premium**: `anthropic/claude-3.5-sonnet` (najwyższa jakość)

