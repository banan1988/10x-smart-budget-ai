// filepath: /Users/kucharsk/workspace/banan1988/10x-smart-budget-ai/src/lib/services/ai-categorization.service.ts
import { OpenRouterService } from './openrouter.service';

/**
 * Result of AI categorization including category key, confidence, and reasoning.
 */
export interface CategorizationResult {
  categoryKey: string;
  confidence: number;
  reasoning: string;
}

/**
 * Valid category keys for transaction categorization.
 */
const VALID_CATEGORIES = [
  'groceries',
  'transport',
  'entertainment',
  'restaurants',
  'utilities',
  'health',
  'shopping',
  'education',
  'housing',
  'other',
] as const;

/**
 * JSON schema for the expected AI response format.
 * Uses strict schema to enforce exact response structure with enum for categoryKey.
 */
const CATEGORY_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    categoryKey: {
      type: 'string',
      enum: VALID_CATEGORIES,
      description: 'The suggested category key for the transaction',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'A confidence score between 0 and 1 indicating how certain the model is about the categorization',
    },
    reasoning: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'A brief explanation (max 200 chars) of why this category was chosen',
    },
  },
  required: ['categoryKey', 'confidence', 'reasoning'],
  additionalProperties: false,
};

/**
 * System prompt that defines the AI's behavior and context for categorization.
 */
const SYSTEM_PROMPT = `You are an expert in personal finance categorization. Your task is to analyze transaction descriptions and categorize them into appropriate spending categories.

Available categories:
- groceries: Food shopping, supermarkets, grocery stores
- transport: Public transport, fuel, car maintenance, parking, ride-sharing
- entertainment: Movies, concerts, games, streaming services, hobbies
- restaurants: Dining out, cafes, food delivery, bars
- utilities: Electricity, water, gas, internet, phone bills
- health: Medical expenses, pharmacy, gym, wellness
- shopping: Clothing, electronics, home goods, non-grocery retail
- education: Books, courses, tuition, learning materials
- housing: Rent, mortgage, home insurance, property taxes
- other: Anything that doesn't fit the above categories

Analyze the transaction description and provide:
1. The most appropriate category key (use the exact keys listed above)
2. A confidence score (0-1) indicating your certainty
3. A brief reasoning explaining your choice

Be precise and consistent in your categorization.`;

/**
 * Service for AI-powered transaction categorization.
 * Uses OpenRouter API to categorize transactions based on their descriptions.
 *
 * This service handles:
 * - Transaction description analysis
 * - Category suggestion with confidence scores
 * - Fallback to 'other' category for low confidence
 * - Reasoning for categorization decisions
 *
 * @example
 * ```typescript
 * const service = new AiCategorizationService();
 * const result = await service.categorizeTransaction('Coffee at Starbucks');
 * // {
 * //   categoryKey: 'restaurants',
 * //   confidence: 0.95,
 * //   reasoning: 'Coffee purchase at a cafe establishment'
 * // }
 * ```
 */
export class AiCategorizationService {
  private openRouterService: OpenRouterService;

  /**
   * Minimum confidence threshold for accepting AI categorization.
   * Below this threshold, the transaction will be categorized as 'other'.
   */
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.5;

  /**
   * Fallback models to try in order if one fails or runs out of credits.
   *
   * Priority order:
   * 1. Custom model from env (if set)
   * 2. Free models (no cost, good for testing)
   * 3. Paid models (fallback if free models fail)
   *
   * Each model will be tried until one succeeds or all fail.
   */
  private readonly FALLBACK_MODELS: string[];

  /**
   * Temperature for AI requests.
   * Lower values (0.1-0.3) make output more deterministic and consistent.
   */
  private readonly TEMPERATURE = 0.2;

  /**
   * Maximum tokens for the response.
   * Category + confidence + reasoning should fit comfortably within this limit.
   */
  private readonly MAX_TOKENS = 150;

  constructor() {
    this.openRouterService = new OpenRouterService();

    // Build fallback models list with custom model first if provided
    const customModel = import.meta.env.OPENROUTER_MODEL;
    const freeModels = [
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'meta-llama/llama-3.2-1b-instruct:free',
    ];
    const paidModels = [
      'openai/gpt-4o-mini',
      'anthropic/claude-3-haiku',
    ];

    if (customModel) {
      // Custom model + free models + paid models
      this.FALLBACK_MODELS = [customModel, ...freeModels, ...paidModels];
    } else {
      // Just free models + paid models
      this.FALLBACK_MODELS = [...freeModels, ...paidModels];
    }
  }

  /**
   * Categorizes a transaction based on its description using AI.
   *
   * The method:
   * 1. Sends the description to OpenRouter API
   * 2. Gets category, confidence, and reasoning
   * 3. Returns 'other' if confidence is below threshold
   * 4. Validates the returned category key
   *
   * @param description - The transaction description to categorize
   * @returns Promise resolving to CategorizationResult
   * @throws {Error} If the AI service fails or returns invalid data
   *
   * @example
   * ```typescript
   * const result = await service.categorizeTransaction('Uber ride to airport');
   * // {
   * //   categoryKey: 'transport',
   * //   confidence: 0.92,
   * //   reasoning: 'Ride-sharing service for transportation'
   * // }
   * ```
   */
  public async categorizeTransaction(description: string): Promise<CategorizationResult> {
    // Validate input
    if (!description || description.trim().length === 0) {
      return {
        categoryKey: 'other',
        confidence: 0,
        reasoning: 'No description provided',
      };
    }

    // Truncate very long descriptions to avoid excessive token usage
    const truncatedDescription = description.length > 500
      ? description.substring(0, 500) + '...'
      : description;

    // Try each model in fallback order until one succeeds
    const errors: Array<{ model: string; error: string }> = [];

    for (const model of this.FALLBACK_MODELS) {
      try {
        console.log(`Attempting categorization with model: ${model}`);

        const result = await this.categorizeWithModel(model, truncatedDescription);

        // Success! Log which model worked and return
        console.log(`✓ Successfully categorized with model: ${model}`);
        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`✗ Model ${model} failed:`, errorMessage);

        errors.push({ model, error: errorMessage });

        // Check if it's a rate limit / credit issue - try next model immediately
        if (errorMessage.includes('rate limit') ||
            errorMessage.includes('insufficient_quota') ||
            errorMessage.includes('402')) {
          console.log(`→ Trying next fallback model due to quota/rate limit...`);
          continue;
        }

        // For other errors, also try next model
        console.log(`→ Trying next fallback model...`);
        continue;
      }
    }

    // All models failed - return fallback
    console.error('All AI models failed for categorization:', errors);
    return {
      categoryKey: 'other',
      confidence: 0,
      reasoning: `AI categorization unavailable. Tried ${errors.length} model(s).`,
    };
  }

  /**
   * Categorizes a transaction using a specific model.
   * Uses json_schema with strict mode to enforce exact response structure.
   * Falls back to json_object if strict mode is not supported.
   *
   * @param model - The model identifier to use
   * @param description - The transaction description to categorize
   * @returns Promise resolving to CategorizationResult
   * @throws {Error} If the model fails or returns invalid data
   */
  private async categorizeWithModel(model: string, description: string): Promise<CategorizationResult> {
    // Build the user prompt - keep it concise
    const userPrompt = `Categorize this transaction: "${description}"

Available categories: ${VALID_CATEGORIES.join(', ')}

Provide:
- categoryKey: exact category name from the list
- confidence: number 0-1 indicating certainty
- reasoning: brief explanation (max 200 chars)`;

    // Try with json_schema strict mode first
    try {
      const result = await this.openRouterService.getChatCompletion<CategorizationResult>({
        model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        responseFormat: {
          type: 'json_schema',
          json_schema: {
            name: 'transaction_category',
            strict: true,
            schema: CATEGORY_RESPONSE_SCHEMA,
          },
        },
        temperature: this.TEMPERATURE,
        maxTokens: this.MAX_TOKENS,
      });

      return this.validateAndNormalizeResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';

      // If json_schema strict mode is not supported, try with json_object
      if (errorMessage.includes('not supported') ||
          errorMessage.includes('json_schema') ||
          errorMessage.includes('strict')) {
        console.log(`Model ${model} doesn't support json_schema strict mode, falling back to json_object`);

        const result = await this.openRouterService.getChatCompletion<CategorizationResult>({
          model,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt,
          responseFormat: {
            type: 'json_object',
          },
          temperature: this.TEMPERATURE,
          maxTokens: this.MAX_TOKENS,
        });

        return this.validateAndNormalizeResult(result);
      }

      // For other errors, re-throw
      throw error;
    }
  }

  /**
   * Validates and normalizes the AI response to ensure it meets our requirements.
   * Handles both strict json_schema responses and looser json_object responses.
   *
   * @param result - The raw result from the AI model
   * @returns Validated and normalized CategorizationResult
   * @throws {Error} If the result is invalid
   */
  private validateAndNormalizeResult(result: any): CategorizationResult {
    // Validate basic structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    if (!result.categoryKey || typeof result.categoryKey !== 'string') {
      throw new Error('Invalid response: missing or invalid categoryKey');
    }

    // Handle confidence as either string or number (for json_object mode)
    let confidence: number;
    if (typeof result.confidence === 'string') {
      confidence = parseFloat(result.confidence);
      if (isNaN(confidence)) {
        throw new Error('Invalid response: confidence is not a valid number');
      }
    } else if (typeof result.confidence === 'number') {
      confidence = result.confidence;
    } else {
      throw new Error('Invalid response: missing or invalid confidence');
    }

    // Ensure confidence is within valid range
    confidence = Math.max(0, Math.min(1, confidence));

    // Handle reasoning - provide default if missing or empty (for json_object mode)
    const reasoning = result.reasoning &&
                      typeof result.reasoning === 'string' &&
                      result.reasoning.trim().length > 0
      ? result.reasoning.trim()
      : 'AI categorization completed';

    // Check confidence threshold
    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return {
        categoryKey: 'other',
        confidence,
        reasoning: `Low confidence (${confidence.toFixed(2)}): ${reasoning}`,
      };
    }

    // Validate category key is in our enum
    if (!VALID_CATEGORIES.includes(result.categoryKey as any)) {
      console.warn(`AI returned unexpected category: ${result.categoryKey}`);
      return {
        categoryKey: 'other',
        confidence,
        reasoning: `Invalid category "${result.categoryKey}": ${reasoning}`,
      };
    }

    return {
      categoryKey: result.categoryKey,
      confidence,
      reasoning,
    };
  }

  /**
   * Batch categorizes multiple transactions.
   * Currently processes them sequentially, but could be optimized for parallel processing.
   *
   * @param descriptions - Array of transaction descriptions to categorize
   * @returns Promise resolving to array of CategorizationResult objects
   *
   * @example
   * ```typescript
   * const results = await service.batchCategorize([
   *   'Coffee at Starbucks',
   *   'Uber ride',
   *   'Netflix subscription'
   * ]);
   * ```
   */
  public async batchCategorize(descriptions: string[]): Promise<CategorizationResult[]> {
    // For now, process sequentially
    // TODO: Optimize with parallel processing or batch API calls
    const results: CategorizationResult[] = [];

    for (const description of descriptions) {
      const result = await this.categorizeTransaction(description);
      results.push(result);
    }

    return results;
  }
}

