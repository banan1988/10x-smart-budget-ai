// filepath: /Users/kucharsk/workspace/banan1988/10x-smart-budget-ai/src/lib/services/openrouter.service.ts
import { z } from "zod";

/**
 * Zod schema for validating OpenRouter API response structure.
 * Ensures the response contains the expected format with choices array.
 */
const OpenRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    })
  ),
});

/**
 * Zod schema for JSON schema definition used in response format.
 */
const JsonSchemaDefinition = z.object({
  name: z.string(),
  strict: z.boolean().optional(),
  schema: z.record(z.any()),
});

/**
 * Zod schema for response format configuration.
 * Supports both json_schema (structured) and json_object (flexible) formats.
 */
const ResponseFormatSchema = z.union([
  z.object({
    type: z.literal("json_schema"),
    json_schema: JsonSchemaDefinition,
  }),
  z.object({
    type: z.literal("json_object"),
  }),
]);

/**
 * Response format configuration - can be either json_schema or json_object.
 */
export type ResponseFormat =
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict?: boolean;
        schema: object;
      };
    }
  | {
      type: "json_object";
    };

/**
 * Configuration options for chat completion requests.
 *
 * @property model - The model identifier to use (e.g., 'anthropic/claude-3.5-sonnet')
 * @property systemPrompt - System message that defines the model's behavior and context
 * @property userPrompt - User message containing the actual query or task
 * @property responseFormat - Structure defining the expected JSON response format (json_schema or json_object)
 * @property temperature - Controls randomness (0-1). Lower values make output more deterministic
 * @property maxTokens - Maximum number of tokens to generate in the response
 */
export interface ChatCompletionOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  responseFormat: ResponseFormat;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Service for interacting with the OpenRouter API.
 * Provides methods to get chat completions from various LLM models.
 *
 * This service handles:
 * - API authentication
 * - Request formatting
 * - Response validation
 * - Error handling
 * - JSON parsing and type safety
 *
 * @example
 * ```typescript
 * const service = new OpenRouterService();
 * const result = await service.getChatCompletion<{ category: string }>({
 *   model: 'anthropic/claude-3.5-sonnet',
 *   systemPrompt: 'You are a financial categorization assistant.',
 *   userPrompt: 'Categorize: Coffee shop purchase',
 *   responseFormat: {
 *     type: 'json_schema',
 *     json_schema: {
 *       name: 'category',
 *       schema: { type: 'object', properties: { category: { type: 'string' } } }
 *     }
 *   }
 * });
 * ```
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://openrouter.ai/api/v1";

  /**
   * Initializes the OpenRouter service.
   *
   * @throws {Error} If OPENROUTER_API_KEY is not set in environment variables
   */
  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // TODO: Implement proper logging service
      console.error("OpenRouter API key is not configured.");
      throw new Error("OPENROUTER_API_KEY is not set in environment variables.");
    }

    this.apiKey = apiKey;
  }

  /**
   * Gets a chat completion from the OpenRouter API.
   *
   * This method sends a request to the OpenRouter API with the specified configuration,
   * validates the response, and parses the JSON content returned by the model.
   *
   * @template T - The expected type of the parsed JSON response
   * @param options - Configuration options for the chat completion request
   * @returns Promise resolving to the parsed response of type T
   * @throws {Error} If the API request fails, response is invalid, or JSON parsing fails
   *
   * @example
   * ```typescript
   * interface CategoryResult {
   *   category: string;
   *   confidence: number;
   * }
   *
   * const result = await service.getChatCompletion<CategoryResult>({
   *   model: 'anthropic/claude-3.5-sonnet',
   *   systemPrompt: 'You are an expert in personal finance.',
   *   userPrompt: 'Categorize: Amazon purchase',
   *   responseFormat: {
   *     type: 'json_schema',
   *     json_schema: {
   *       name: 'category',
   *       schema: {
   *         type: 'object',
   *         properties: {
   *           category: { type: 'string' },
   *           confidence: { type: 'number' }
   *         },
   *         required: ['category', 'confidence']
   *       }
   *     }
   *   },
   *   temperature: 0.2
   * });
   * ```
   */
  public async getChatCompletion<T>(options: ChatCompletionOptions): Promise<T> {
    const { model, systemPrompt, userPrompt, responseFormat, temperature, maxTokens } = options;

    // Build the payload for the OpenRouter API
    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: responseFormat,
      temperature,
      max_tokens: maxTokens,
    };

    // Send the request and get validated response
    const response = await this.makeRequest<{ choices: { message: { content: string } }[] }>(payload);

    // Extract the content from the first choice
    const content = response.choices[0].message.content;

    // Parse and return the JSON content
    try {
      const parsed = JSON.parse(content) as T;
      return parsed;
    } catch (error) {
      // TODO: Implement proper logging service
      console.error("Failed to parse JSON response from model:", content);
      console.error("Parse error:", error instanceof Error ? error.message : "Unknown error");

      // Try to provide more context about the issue
      if (content.length === 0) {
        throw new Error("Empty response from model.");
      }

      // Check if response looks truncated
      const trimmed = content.trim();
      if (
        trimmed.endsWith(",") ||
        trimmed.endsWith("{") ||
        trimmed.endsWith("[") ||
        (!trimmed.endsWith("}") && !trimmed.endsWith("]") && trimmed.includes("{"))
      ) {
        throw new Error("Truncated JSON response from model. Try increasing maxTokens or using a more concise prompt.");
      }

      throw new Error(`Invalid JSON response from model: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Makes an HTTP request to the OpenRouter API.
   *
   * This private method handles:
   * - HTTP communication with proper headers and authentication
   * - HTTP error handling (non-2xx responses)
   * - Response structure validation using Zod
   *
   * @template T - The expected type of the API response
   * @param body - The request payload to send to the API
   * @returns Promise resolving to the validated API response
   * @throws {Error} If the request fails, returns a non-2xx status, or has invalid structure
   */
  private async makeRequest<T>(body: object): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      // Handle non-2xx HTTP responses
      if (!response.ok) {
        const errorBody = await response.text();
        // TODO: Implement proper logging service
        console.error(`OpenRouter API error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`API request failed with status ${response.status}`);
      }

      // Parse JSON response
      const data = await response.json();

      // Log the full response for debugging
      console.log("OpenRouter API response:", JSON.stringify(data, null, 2));

      // Check if the response contains an error field (OpenRouter error format)
      if (data.error) {
        console.error("OpenRouter API returned an error:", data.error);
        throw new Error(`API error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Validate response structure using Zod schema
      const validation = OpenRouterResponseSchema.safeParse(data);
      if (!validation.success) {
        // TODO: Implement proper logging service
        console.error(
          "Invalid response structure from OpenRouter API:",
          JSON.stringify(validation.error.errors, null, 2)
        );
        console.error("Actual response data:", JSON.stringify(data, null, 2));
        throw new Error("Invalid response structure from API.");
      }

      return validation.data as T;
    } catch (error) {
      // Handle network errors or other fetch failures
      if (error instanceof Error) {
        // Re-throw our custom errors
        if (error.message.includes("API request failed") || error.message.includes("Invalid response structure")) {
          throw error;
        }
        // Wrap network errors
        console.error("Network error during OpenRouter API request:", error.message);
        throw new Error(`Network error: ${error.message}`);
      }
      // Unexpected error type
      throw new Error("Unexpected error during API request");
    }
  }
}
