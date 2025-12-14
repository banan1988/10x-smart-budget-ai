import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiCategorizationService } from "./ai-categorization.service";
import { OpenRouterService } from "./openrouter.service";
import { CategoryService } from "./category.service";

// Create a mock getChatCompletion function that can be configured per test
let mockGetChatCompletion = vi.fn();

interface OpenRouterServiceMock {
  getChatCompletion: typeof mockGetChatCompletion;
}

// ...existing code...
vi.mock("./openrouter.service", () => {
  return {
    OpenRouterService: vi.fn().mockImplementation(function (this: OpenRouterServiceMock) {
      this.getChatCompletion = mockGetChatCompletion;
    }),
  };
});

// Mock CategoryService
vi.mock("./category.service", () => {
  return {
    CategoryService: {
      getGlobalCategories: vi.fn(),
      getCategoryByKey: vi.fn(),
    },
  };
});

describe("AiCategorizationService", () => {
  let service: AiCategorizationService;
  let mockSupabase: Record<string, unknown>;

  // Mock categories from database
  const mockCategories = [
    { id: 1, key: "groceries", name: "Zakupy spożywcze" },
    { id: 2, key: "transport", name: "Transport" },
    { id: 3, key: "entertainment", name: "Rozrywka" },
    { id: 4, key: "dining", name: "Restauracje" },
    { id: 5, key: "utilities", name: "Opłaty" },
    { id: 6, key: "healthcare", name: "Zdrowie" },
    { id: 7, key: "shopping", name: "Zakupy" },
    { id: 8, key: "education", name: "Edukacja" },
    { id: 9, key: "housing", name: "Mieszkanie" },
    { id: 10, key: "insurance", name: "Ubezpieczenia" },
    { id: 11, key: "savings", name: "Oszczędności" },
    { id: 12, key: "other", name: "Inne" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock SupabaseClient
    mockSupabase = {
      from: vi.fn(),
    };

    // Reset the mock function
    mockGetChatCompletion = vi.fn();
    // Re-attach it to the mocked class
    vi.mocked(OpenRouterService).mockImplementation(function (this: OpenRouterServiceMock) {
      this.getChatCompletion = mockGetChatCompletion;
    } as never);

    // Mock CategoryService.getGlobalCategories to return test categories
    vi.mocked(CategoryService.getGlobalCategories).mockResolvedValue(mockCategories);

    service = new AiCategorizationService(mockSupabase);
  });

  describe("categorizeTransaction", () => {
    it("should successfully categorize a transaction", async () => {
      // Arrange
      const mockResult = {
        categoryKey: "dining",
        confidence: 0.95,
        reasoning: "Coffee purchase at a cafe establishment",
      };
      mockGetChatCompletion.mockResolvedValue(mockResult);

      // Act
      const result = await service.categorizeTransaction("Coffee at Starbucks");

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.categoryKey).toBe("dining");
      expect(result.confidence).toBe(0.95);
      expect(mockGetChatCompletion).toHaveBeenCalledTimes(1);

      // Assert Types
      expectTypeOf(result).toMatchTypeOf<{ categoryKey: string; confidence: number; reasoning: string }>();
      expectTypeOf(result.categoryKey).toMatchTypeOf<string>();
      expectTypeOf(result.confidence).toMatchTypeOf<number>();
    });

    it("should pass correct parameters to OpenRouter service", async () => {
      // Arrange
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "transport",
        confidence: 0.88,
        reasoning: "Fuel purchase",
      });

      // Act
      await service.categorizeTransaction("Gas station");

      // Assert
      expect(mockGetChatCompletion).toHaveBeenCalledTimes(1);
      const callArgs = mockGetChatCompletion.mock.calls[0][0];
      // Model should be from env or default to free model
      expect(callArgs.model).toBeDefined();
      expect(typeof callArgs.model).toBe("string");
      expect(callArgs.systemPrompt).toContain("expert in personal finance");
      expect(callArgs.userPrompt).toContain("Gas station");
      expect(callArgs.temperature).toBe(0.2);
      expect(callArgs.maxTokens).toBe(150);
      expect(callArgs.responseFormat.type).toBe("json_schema");
      expect(callArgs.responseFormat.json_schema).toBeDefined();
      expect(callArgs.responseFormat.json_schema.strict).toBe(true);
    });

    it('should return "other" for empty description', async () => {
      // Act
      const result = await service.categorizeTransaction("");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain("No description provided");
      expect(mockGetChatCompletion).not.toHaveBeenCalled();
    });

    it('should return "other" for whitespace-only description', async () => {
      // Act
      const result = await service.categorizeTransaction("   ");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
      expect(mockGetChatCompletion).not.toHaveBeenCalled();
    });

    it('should return "other" when confidence is below threshold', async () => {
      // Arrange
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "shopping",
        confidence: 0.3, // Below 0.5 threshold
        reasoning: "Uncertain categorization",
      });

      // Act
      const result = await service.categorizeTransaction("Unknown purchase");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0.3);
      expect(result.reasoning).toContain("Low confidence");
      expect(result.reasoning).toContain("0.30");
    });

    it("should handle invalid category key from AI", async () => {
      // Arrange
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "invalid_category",
        confidence: 0.9,
        reasoning: "Some reasoning",
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0.9);
      expect(result.reasoning).toContain("Invalid category");
    });

    it("should handle AI service errors gracefully", async () => {
      // Arrange
      mockGetChatCompletion.mockRejectedValue(new Error("API Error"));

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain("AI categorization unavailable");
    });

    it("should handle invalid AI response structure", async () => {
      // Arrange
      mockGetChatCompletion.mockResolvedValue({
        // Missing categoryKey
        confidence: 0.9,
        reasoning: "Test",
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain("AI categorization unavailable");
    });

    it("should truncate very long descriptions", async () => {
      // Arrange
      const longDescription = "a".repeat(600);
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "other",
        confidence: 0.5,
        reasoning: "Test",
      });

      // Act
      await service.categorizeTransaction(longDescription);

      // Assert
      const callArgs = mockGetChatCompletion.mock.calls[0][0];
      expect(callArgs.userPrompt).toContain("...");
      // The prompt includes the truncated description (500 chars + '...') plus schema instructions
      // So it should be significantly less than the original description length + all the overhead
      expect(callArgs.userPrompt).toContain("aaa...");
      expect(callArgs.userPrompt.length).toBeLessThan(1000); // Reasonable upper bound
    });

    it("should accept all valid category keys from database", async () => {
      // Arrange - Use categories from mockCategories (defined in beforeEach)
      const validCategories = mockCategories.map((c) => c.key);

      for (const category of validCategories) {
        mockGetChatCompletion.mockResolvedValue({
          categoryKey: category,
          confidence: 0.9,
          reasoning: "Test reasoning",
        });

        // Act
        const result = await service.categorizeTransaction("Test");

        // Assert
        expect(result.categoryKey).toBe(category);
        expect(result.confidence).toBe(0.9);
      }
    });

    it("should handle network errors", async () => {
      // Arrange
      mockGetChatCompletion.mockRejectedValue(new Error("Network error: Connection timeout"));

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain("AI categorization unavailable");
    });

    it("should handle null response from AI service", async () => {
      // Arrange
      mockGetChatCompletion.mockResolvedValue(null);

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain("AI categorization unavailable");
    });

    it("should validate confidence is within valid range (0-1)", async () => {
      // Arrange - confidence > 1 is normalized to 1 by service
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "dining",
        confidence: 1.5, // Out of bounds
        reasoning: "Test",
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert - Service normalizes confidence > 1 to 1
      expect(result.categoryKey).toBe("dining");
      expect(result.confidence).toBe(1);
    });

    it("should handle confidence < 0", async () => {
      // Arrange - confidence < 0 is invalid and service rejects it
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "dining",
        confidence: -0.5, // Negative confidence
        reasoning: "Test",
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert - Service rejects negative confidence and returns 'other'
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
    });

    it("should reject unknown category keys not in database", async () => {
      // Arrange
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "unknown_category_xyz", // Not in mockCategories
        confidence: 0.9,
        reasoning: "Test",
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.reasoning).toContain("Invalid category");
    });

    it("should handle missing categoryKey in response", async () => {
      // Arrange - Response missing categoryKey
      mockGetChatCompletion.mockResolvedValue({
        confidence: 0.9,
        reasoning: "Test",
        // Missing: categoryKey
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
    });

    it("should handle missing confidence in response", async () => {
      // Arrange - Response missing confidence
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "dining",
        reasoning: "Test",
        // Missing: confidence
      });

      // Act
      const result = await service.categorizeTransaction("Test transaction");

      // Assert
      expect(result.categoryKey).toBe("other");
      expect(result.confidence).toBe(0);
    });
  });

  describe("batchCategorize", () => {
    it("should categorize multiple transactions", async () => {
      // Arrange
      const descriptions = ["Coffee at Starbucks", "Uber ride", "Netflix subscription"];

      mockGetChatCompletion
        .mockResolvedValueOnce({
          categoryKey: "dining",
          confidence: 0.95,
          reasoning: "Coffee purchase",
        })
        .mockResolvedValueOnce({
          categoryKey: "transport",
          confidence: 0.92,
          reasoning: "Ride-sharing",
        })
        .mockResolvedValueOnce({
          categoryKey: "entertainment",
          confidence: 0.98,
          reasoning: "Streaming service",
        });

      // Act
      const results = await service.batchCategorize(descriptions);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].categoryKey).toBe("dining");
      expect(results[1].categoryKey).toBe("transport");
      expect(results[2].categoryKey).toBe("entertainment");
      expect(mockGetChatCompletion).toHaveBeenCalledTimes(3);
    });

    it("should handle empty array", async () => {
      // Act
      const results = await service.batchCategorize([]);

      // Assert
      expect(results).toHaveLength(0);
      expect(mockGetChatCompletion).not.toHaveBeenCalled();
    });

    it("should handle errors in batch processing", async () => {
      // Arrange
      mockGetChatCompletion
        // First transaction: success
        .mockResolvedValueOnce({
          categoryKey: "dining",
          confidence: 0.95,
          reasoning: "Test",
        })
        // Second transaction: first model fails
        .mockRejectedValueOnce(new Error("API Error"))
        // Second transaction: second model succeeds (fallback)
        .mockResolvedValueOnce({
          categoryKey: "groceries",
          confidence: 0.8,
          reasoning: "Fallback categorization",
        })
        // Third transaction: success
        .mockResolvedValueOnce({
          categoryKey: "transport",
          confidence: 0.9,
          reasoning: "Test",
        });

      // Act
      const results = await service.batchCategorize(["Desc1", "Desc2", "Desc3"]);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].categoryKey).toBe("dining");
      expect(results[1].categoryKey).toBe("groceries"); // Fallback model succeeded
      expect(results[2].categoryKey).toBe("transport");
    });

    it("should process transactions sequentially", async () => {
      // Arrange
      const callOrder: number[] = [];
      mockGetChatCompletion.mockImplementation(async () => {
        callOrder.push(callOrder.length + 1);
        return {
          categoryKey: "other",
          confidence: 0.5,
          reasoning: "Test",
        };
      });

      // Act
      await service.batchCategorize(["Desc1", "Desc2", "Desc3"]);

      // Assert
      expect(callOrder).toEqual([1, 2, 3]); // Sequential processing
    });

    it("should handle large batch (100+ items) efficiently", async () => {
      // Arrange
      const largeDescriptions = Array(150)
        .fill(0)
        .map((_, i) => `Description ${i}`);
      mockGetChatCompletion.mockResolvedValue({
        categoryKey: "other",
        confidence: 0.5,
        reasoning: "Test",
      });

      // Act
      const startTime = performance.now();
      const results = await service.batchCategorize(largeDescriptions);
      const duration = performance.now() - startTime;

      // Assert - Should process all items successfully
      expect(results).toHaveLength(150);
      expect(results.every((r) => r.categoryKey === "other")).toBe(true);
      // Should complete in reasonable time (not a hard limit, just ensures no infinite loops)
      expect(duration).toBeLessThan(30000);
      // Verify all calls were made
      expect(mockGetChatCompletion).toHaveBeenCalledTimes(150);
    });
  });
});
