/* eslint-disable no-console */
import { OpenRouterService } from "./openrouter.service";
import { CategoryService } from "./category.service";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Result of AI categorization including category key, confidence, and reasoning.
 */
export interface CategorizationResult {
  categoryKey: string;
  confidence: number;
  reasoning: string;
}

/**
 * Creates JSON schema for the expected AI response format.
 * Uses strict schema to enforce exact response structure with enum for categoryKey.
 *
 * @param validCategories - Array of valid category keys
 * @returns JSON schema object
 */
const createCategoryResponseSchema = (validCategories: string[]) => ({
  type: "object",
  properties: {
    categoryKey: {
      type: "string",
      enum: validCategories,
      description: "The suggested category key for the transaction",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "A confidence score between 0 and 1 indicating how certain the model is about the categorization",
    },
    reasoning: {
      type: "string",
      minLength: 1,
      maxLength: 200,
      description: "A brief explanation (max 200 chars) of why this category was chosen",
    },
  },
  required: ["categoryKey", "confidence", "reasoning"],
  additionalProperties: false,
});

/**
 * Creates system prompt that defines the AI's behavior and context for categorization.
 *
 * @param categories - Array of category objects with key and name
 * @returns System prompt string
 */
const createSystemPrompt = (categories: { key: string; name: string }[]) => {
  const categoryList = categories.map((cat) => `- ${cat.key}: ${cat.name}`).join("\n");

  return `You are an expert in personal finance categorization. Your task is to analyze transaction descriptions and categorize them into appropriate spending categories.

Available categories:
${categoryList}

Analyze the transaction description and provide:
1. The most appropriate category key (use the exact keys listed above)
2. A confidence score (0-1) indicating your certainty
3. A brief reasoning explaining your choice

Be precise and consistent in your categorization.`;
};

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
 * const service = new AiCategorizationService(supabase);
 * const result = await service.categorizeTransaction('Coffee at Starbucks');
 * // {
 * //   categoryKey: 'dining',
 * //   confidence: 0.95,
 * //   reasoning: 'Coffee purchase at a cafe establishment'
 * // }
 * ```
 */
export class AiCategorizationService {
  private openRouterService: OpenRouterService;
  private supabase: SupabaseClient;

  /**
   * Minimum confidence threshold for accepting AI categorization.
   * Below this threshold, the transaction will be categorized as 'other'.
   */
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.5;

  /**
   * Fallback models to try in order if one fails or runs out of credits.
   *
   * Can be configured via OPENROUTER_FALLBACK_MODELS env variable as comma-separated list.
   * Example: "google/gemini-2.0-flash-exp:free,meta-llama/llama-3.2-3b-instruct:free"
   *
   * Priority order:
   * 1. Custom model from OPENROUTER_MODEL env (if set)
   * 2. Models from OPENROUTER_FALLBACK_MODELS env (if set)
   * 3. Default free models (no cost, good for testing)
   * 4. Default paid models (fallback if free models fail)
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

  /**
   * Cached categories from database to avoid repeated queries.
   */
  private categoriesCache: { key: string; name: string }[] | null = null;

  constructor(supabase: SupabaseClient) {
    this.openRouterService = new OpenRouterService();
    this.supabase = supabase;

    // Build fallback models list
    const customModel = import.meta.env.OPENROUTER_MODEL;
    const fallbackModelsEnv = import.meta.env.OPENROUTER_FALLBACK_MODELS;

    // Parse fallback models from env (comma-separated)
    const envModels = fallbackModelsEnv
      ? fallbackModelsEnv
          .split(",")
          .map((m: string) => m.trim())
          .filter(Boolean)
      : [];

    // Default free models
    const defaultFreeModels = [
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "meta-llama/llama-3.2-1b-instruct:free",
    ];

    // Default paid models
    const defaultPaidModels = ["openai/gpt-4o-mini", "anthropic/claude-3-haiku"];

    // Build final list: custom model + env models + default models
    const allModels: string[] = [];

    if (customModel) {
      allModels.push(customModel);
    }

    if (envModels.length > 0) {
      allModels.push(...envModels);
    } else {
      // Use defaults only if no env models specified
      allModels.push(...defaultFreeModels, ...defaultPaidModels);
    }

    this.FALLBACK_MODELS = allModels;
  }

  /**
   * Loads and caches categories from the database.
   *
   * @returns Promise resolving to array of categories with key and name
   * @throws Error if database query fails
   */
  private async getCategories(): Promise<{ key: string; name: string }[]> {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }

    const categories = await CategoryService.getGlobalCategories(this.supabase);
    this.categoriesCache = categories.map((cat) => ({
      key: cat.key,
      name: cat.name,
    }));

    return this.categoriesCache;
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
        categoryKey: "other",
        confidence: 0,
        reasoning: "No description provided",
      };
    }

    // Load categories from database
    let categories: { key: string; name: string }[];
    try {
      categories = await this.getCategories();
    } catch (error) {
      console.error("Failed to load categories from database:", error);
      // Fallback to 'other' if we can't load categories
      return {
        categoryKey: "other",
        confidence: 0,
        reasoning: "Categories unavailable",
      };
    }

    // Truncate very long descriptions to avoid excessive token usage
    const truncatedDescription = description.length > 500 ? description.substring(0, 500) + "..." : description;

    // Try each model in fallback order until one succeeds
    const errors: { model: string; error: string }[] = [];

    for (const model of this.FALLBACK_MODELS) {
      try {
        console.log(`Attempting categorization with model: ${model}`);

        const result = await this.categorizeWithModel(model, truncatedDescription, categories);

        // Success! Log which model worked and return
        console.log(`✓ Successfully categorized with model: ${model}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.warn(`✗ Model ${model} failed:`, errorMessage);

        errors.push({ model, error: errorMessage });

        // Check if it's a rate limit / credit issue - try next model immediately
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("insufficient_quota") ||
          errorMessage.includes("402")
        ) {
          console.log(`→ Trying next fallback model due to quota/rate limit...`);
          continue;
        }

        // For other errors, also try next model
        console.log(`→ Trying next fallback model...`);
        continue;
      }
    }

    // All models failed - return fallback
    console.error("All AI models failed for categorization:", errors);
    return {
      categoryKey: "other",
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
   * @param categories - Array of valid categories from database
   * @returns Promise resolving to CategorizationResult
   * @throws {Error} If the model fails or returns invalid data
   */
  private async categorizeWithModel(
    model: string,
    description: string,
    categories: { key: string; name: string }[]
  ): Promise<CategorizationResult> {
    // Extract category keys for validation
    const validCategoryKeys = categories.map((cat) => cat.key);

    // Build the user prompt - keep it concise
    const userPrompt = `Categorize this transaction: "${description}"

Available categories: ${validCategoryKeys.join(", ")}

Provide:
- categoryKey: exact category name from the list
- confidence: number 0-1 indicating certainty
- reasoning: brief explanation (max 200 chars)`;

    // Create dynamic schema and system prompt based on actual categories
    const categorySchema = createCategoryResponseSchema(validCategoryKeys);
    const systemPrompt = createSystemPrompt(categories);

    // Try with json_schema strict mode first
    try {
      const result = await this.openRouterService.getChatCompletion<CategorizationResult>({
        model,
        systemPrompt,
        userPrompt,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "transaction_category",
            strict: true,
            schema: categorySchema,
          },
        },
        temperature: this.TEMPERATURE,
        maxTokens: this.MAX_TOKENS,
      });

      return this.validateAndNormalizeResult(result, validCategoryKeys);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";

      // If json_schema strict mode is not supported, try with json_object
      if (
        errorMessage.includes("not supported") ||
        errorMessage.includes("json_schema") ||
        errorMessage.includes("strict")
      ) {
        console.log(`Model ${model} doesn't support json_schema strict mode, falling back to json_object`);

        const result = await this.openRouterService.getChatCompletion<CategorizationResult>({
          model,
          systemPrompt,
          userPrompt,
          responseFormat: {
            type: "json_object",
          },
          temperature: this.TEMPERATURE,
          maxTokens: this.MAX_TOKENS,
        });

        return this.validateAndNormalizeResult(result, validCategoryKeys);
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
   * @param validCategoryKeys - Array of valid category keys from database
   * @returns Validated and normalized CategorizationResult
   * @throws {Error} If the result is invalid
   */
  private validateAndNormalizeResult(
    result: Record<string, unknown>,
    validCategoryKeys: string[]
  ): CategorizationResult {
    // Validate basic structure
    if (!result || typeof result !== "object") {
      throw new Error("Invalid response: not an object");
    }

    if (!result.categoryKey || typeof result.categoryKey !== "string") {
      throw new Error("Invalid response: missing or invalid categoryKey");
    }

    // Handle confidence as either string or number (for json_object mode)
    let confidence: number;
    if (typeof result.confidence === "string") {
      confidence = parseFloat(result.confidence);
      if (isNaN(confidence)) {
        throw new Error("Invalid response: confidence is not a valid number");
      }
    } else if (typeof result.confidence === "number") {
      confidence = result.confidence;
    } else {
      throw new Error("Invalid response: missing or invalid confidence");
    }

    // Ensure confidence is within valid range
    confidence = Math.max(0, Math.min(1, confidence));

    // Handle reasoning - provide default if missing or empty (for json_object mode)
    const reasoning =
      result.reasoning && typeof result.reasoning === "string" && result.reasoning.trim().length > 0
        ? result.reasoning.trim()
        : "AI categorization completed";

    // Check confidence threshold
    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return {
        categoryKey: "other",
        confidence,
        reasoning: `Low confidence (${confidence.toFixed(2)}): ${reasoning}`,
      };
    }

    // Validate category key is in our valid list from database
    if (!validCategoryKeys.includes(result.categoryKey)) {
      console.warn(`AI returned unexpected category: ${result.categoryKey}`);
      return {
        categoryKey: "other",
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
