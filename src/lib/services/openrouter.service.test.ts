// filepath: /Users/kucharsk/workspace/banan1988/10x-smart-budget-ai/src/lib/services/openrouter.service.test.ts
import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import { OpenRouterService } from "./openrouter.service";
import { TEST_API_KEY } from "../../test/setup";

describe("OpenRouterService", () => {
  describe("constructor", () => {
    it("should initialize successfully with valid API key", () => {
      // Arrange - API key is already set in global setup from setup.ts

      // Act & Assert - should not throw
      expect(() => new OpenRouterService()).not.toThrow();
    });

    it("should throw error when OPENROUTER_API_KEY is not set", () => {
      // Arrange - mock missing API key by deleting the property
      const originalKey = import.meta.env.OPENROUTER_API_KEY;
      delete (import.meta.env as any).OPENROUTER_API_KEY;

      try {
        // Act & Assert
        expect(() => new OpenRouterService()).toThrow("OPENROUTER_API_KEY is not set in environment variables.");
      } finally {
        // Restore
        import.meta.env.OPENROUTER_API_KEY = originalKey;
      }
    });

    it("should throw error when OPENROUTER_API_KEY is empty string", () => {
      // Arrange - mock empty API key
      const originalKey = import.meta.env.OPENROUTER_API_KEY;
      import.meta.env.OPENROUTER_API_KEY = "";

      try {
        // Act & Assert
        expect(() => new OpenRouterService()).toThrow("OPENROUTER_API_KEY is not set in environment variables.");
      } finally {
        // Restore
        import.meta.env.OPENROUTER_API_KEY = originalKey;
      }
    });
  });

  describe("getChatCompletion", () => {
    // Local setup for this describe block - stub fetch before each test
    beforeEach(() => {
      if (!global.fetch || !(global.fetch as any).mockResolvedValueOnce) {
        vi.stubGlobal("fetch", vi.fn());
      }
      vi.clearAllMocks();
    });

    it("should successfully get chat completion with valid response", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({ category: "food", confidence: 0.95 }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        systemPrompt: "You are a categorization assistant.",
        userPrompt: "Categorize: Coffee shop",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "category",
            schema: {
              type: "object",
              properties: {
                category: { type: "string" },
                confidence: { type: "number" },
              },
            },
          },
        },
        temperature: 0.2,
      };

      // Act
      const result = await service.getChatCompletion<{ category: string; confidence: number }>(options);

      // Assert
      expect(result).toEqual({ category: "food", confidence: 0.95 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key-123",
          },
        })
      );

      // Assert Types
      expectTypeOf(result).toMatchTypeOf<{ category: string; confidence: number }>();
      expectTypeOf(result.category).toMatchTypeOf<string>();
      expectTypeOf(result.confidence).toMatchTypeOf<number>();
    });

    it("should include temperature and maxTokens in request payload when provided", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ result: "test" }) } }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        systemPrompt: "System prompt",
        userPrompt: "User prompt",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
        temperature: 0.7,
        maxTokens: 1000,
      };

      // Act
      await service.getChatCompletion(options);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1000);
    });

    it("should properly format messages in request payload", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const mockResponse = {
        choices: [{ message: { content: JSON.stringify({ result: "test" }) } }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const options = {
        model: "test-model",
        systemPrompt: "System instruction",
        userPrompt: "User question",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act
      await service.getChatCompletion(options);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.messages).toEqual([
        { role: "system", content: "System instruction" },
        { role: "user", content: "User question" },
      ]);
    });

    it("should throw error when API returns non-ok status", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid API key",
      });

      const options = {
        model: "test-model",
        systemPrompt: "System",
        userPrompt: "User",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("API request failed with status 401");
    });

    it("should throw error when response structure is invalid", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const invalidResponse = { invalid: "structure" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      const options = {
        model: "test-model",
        systemPrompt: "System",
        userPrompt: "User",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("Invalid response structure from API.");
    });

    it("should throw error when model returns invalid JSON", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Not valid JSON {",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const options = {
        model: "test-model",
        systemPrompt: "System",
        userPrompt: "User",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      // The service now detects truncated JSON and provides a more specific error
      await expect(service.getChatCompletion(options)).rejects.toThrow("Truncated JSON response from model");
    });

    it("should throw error for malformed JSON (not truncated)", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const mockResponse = {
        choices: [
          {
            message: {
              content: "This is not JSON at all - just plain text",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const options = {
        model: "test-model",
        systemPrompt: "System",
        userPrompt: "User",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("Invalid JSON response from model");
    });

    it("should handle network errors", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const options = {
        model: "test-model",
        systemPrompt: "System",
        userPrompt: "User",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("Network error");
    });

    it("should parse and return typed response correctly", async () => {
      // Arrange
      interface ExpectedResponse {
        category: string;
        confidence: number;
        subcategories: string[];
      }

      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      const expectedData: ExpectedResponse = {
        category: "groceries",
        confidence: 0.88,
        subcategories: ["food", "beverages"],
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(expectedData),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const options = {
        model: "test-model",
        systemPrompt: "System",
        userPrompt: "User",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act
      const result = await service.getChatCompletion<ExpectedResponse>(options);

      // Assert
      expect(result).toEqual(expectedData);
      expect(result.category).toBe("groceries");
      expect(result.subcategories).toHaveLength(2);
    });
  });

  describe("getChatCompletion - Network & Server Error Cases", () => {
    // Local setup for this describe block - stub fetch before each test
    beforeEach(() => {
      if (!global.fetch || !(global.fetch as any).mockRejectedValue) {
        vi.stubGlobal("fetch", vi.fn());
      }
      vi.clearAllMocks();
    });

    it("should handle network timeout error", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockRejectedValue(new Error("Network timeout"));

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        userPrompt: "test",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("Network timeout");
    });

    it("should handle HTTP 500 server error", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => '{"error": "Internal server error"}',
      });

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        userPrompt: "test",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("API request failed with status 500");
    });

    it("should handle rate limit error (429)", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => '{"error": "Rate limited"}',
      });

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        userPrompt: "test",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("API request failed with status 429");
    });

    it("should handle authentication error (401)", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => '{"error": "Invalid API key"}',
      });

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        userPrompt: "test",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow("API request failed with status 401");
    });

    it("should handle malformed JSON response from API", async () => {
      // Arrange
      const service = new OpenRouterService();
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const options = {
        model: "anthropic/claude-3.5-sonnet",
        userPrompt: "test",
        responseFormat: {
          type: "json_schema" as const,
          json_schema: {
            name: "test",
            schema: { type: "object", properties: {} },
          },
        },
      };

      // Act & Assert
      await expect(service.getChatCompletion(options)).rejects.toThrow();
    });
  });
});
