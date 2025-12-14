/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach, expectTypeOf } from "vitest";
import { BackgroundCategorizationService } from "./background-categorization.service";
import { createMockSupabaseClient } from "../../test/mocks/supabase.mock";
import type { SupabaseClient } from "../../db/supabase.client";

// Mock AiCategorizationService
vi.mock("./ai-categorization.service", () => {
  return {
    AiCategorizationService: vi.fn(function () {
      this.categorizeTransaction = vi.fn();
    }),
  };
});

// Mock CategoryService
vi.mock("./category.service", () => {
  return {
    CategoryService: {
      getCategoryByKey: vi.fn(),
    },
  };
});

import { AiCategorizationService } from "./ai-categorization.service";
import { CategoryService } from "./category.service";

describe("BackgroundCategorizationService", () => {
  let service: BackgroundCategorizationService;
  let mockSupabase: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient({}) as SupabaseClient;
    service = new BackgroundCategorizationService(mockSupabase);
  });

  afterEach(() => {
    // Reset fake timers if any test used them
    try {
      vi.useRealTimers();
    } catch {
      // Timers may not be fake, that's ok
    }
  });

  describe("categorizeTransactionInBackground", () => {
    it("should queue background categorization without blocking", async () => {
      // Arrange
      vi.useFakeTimers();
      const transactionId = 42;
      const description = "Coffee at Starbucks";
      const userId = "test-user";

      // Mock AI categorization
      const mockAiService = vi.mocked(AiCategorizationService);
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockResolvedValue({
        categoryKey: "dining",
        confidence: 0.95,
        reasoning: "Coffee purchase",
      });

      // Mock category lookup
      vi.mocked(CategoryService.getCategoryByKey).mockResolvedValue({
        id: 5,
        key: "dining",
        name: "Dining",
      } as never);

      // Mock Supabase update
      const updateSpy = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));
      mockSupabase.from = vi.fn(() => ({ update: updateSpy }));

      // Act - Method should return immediately (non-blocking)
      const result = service.categorizeTransactionInBackground(transactionId, description, userId);

      // Should not await yet - it returns a promise that resolves immediately
      expect(result).toBeInstanceOf(Promise);

      // Assert Type
      expectTypeOf(result).toMatchTypeOf<Promise<void>>();

      // Advance timers for background processing to complete
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      // Assert - Verify side effects occurred
      expect(mockSupabase.from).toHaveBeenCalledWith("transactions");
      expect(updateSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should log categorization start", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const transactionId = 42;
      const description = "Test expense";
      const userId = "test-user";

      // Mock AI categorization to succeed
      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockResolvedValue({
        categoryKey: "dining",
        confidence: 0.95,
        reasoning: "Coffee purchase",
      });

      // Mock category lookup
      (CategoryService.getCategoryByKey as any).mockResolvedValue({
        id: 5,
        key: "dining",
        name: "Dining",
      });

      // Mock Supabase update
      const mockFrom = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));
      mockSupabase.from = mockFrom as any;

      // Act
      await service.categorizeTransactionInBackground(transactionId, description, userId);

      // Wait for background task to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - Logging should show background categorization started
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[Background]"));

      consoleSpy.mockRestore();
    });

    it("should handle empty description gracefully", async () => {
      // Arrange
      const transactionId = 42;
      const description = "";
      const userId = "test-user";

      // Act - Should queue task successfully without throwing
      const result = service.categorizeTransactionInBackground(transactionId, description, userId);

      // Assert - Should return a Promise
      expect(result).toBeInstanceOf(Promise);
      // Verify it resolves without error
      await expect(result).resolves.toBeUndefined();
    });

    it("should handle null description gracefully", async () => {
      // Arrange
      const transactionId = 42;
      const description = null as any;
      const userId = "test-user";

      // Act - Should queue task successfully without throwing
      const result = service.categorizeTransactionInBackground(transactionId, description, userId);

      // Assert - Should return a Promise
      expect(result).toBeInstanceOf(Promise);
      // Verify it resolves without error
      await expect(result).resolves.toBeUndefined();
    });

    it("should log error and continue when categorization fails", async () => {
      // Arrange
      vi.useFakeTimers();
      const transactionId = 42;
      const description = "Test transaction";
      const userId = "test-user";

      // Mock AI categorization to fail
      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockRejectedValue(new Error("API connection error"));

      // Update mock for this test
      const updateSpy = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));
      mockSupabase.from = vi.fn(() => ({ update: updateSpy })) as any;
      service = new BackgroundCategorizationService(mockSupabase);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      // Act
      void service.categorizeTransactionInBackground(transactionId, description, userId);

      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      // Assert - Should log error when categorization fails
      expect(consoleSpy).toHaveBeenCalled();
      expect(
        consoleSpy.mock.calls.some(
          (call) => (call[0] as string)?.includes?.("[Background]") || (call[0] as string)?.includes("Error")
        )
      ).toBe(true);

      consoleSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("performBackgroundCategorization (via public method)", () => {
    it("should update transaction with category when AI categorization succeeds", async () => {
      // Arrange
      const transactionId = 42;
      const description = "Coffee at Starbucks";
      const userId = "test-user";

      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockResolvedValue({
        categoryKey: "dining",
        confidence: 0.95,
        reasoning: "Coffee purchase at cafe",
      });

      (CategoryService.getCategoryByKey as any).mockResolvedValue({
        id: 5,
        key: "dining",
        name: "Dining",
      });

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
      })) as any;

      // Act
      await service.categorizeTransactionInBackground(transactionId, description, userId);

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Assert - Update should be called with category_id and completion status
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          categorization_status: "completed",
        })
      );
    });

    it("should mark categorization as completed even if category not found", async () => {
      // Arrange
      const transactionId = 42;
      const description = "Unknown category item";
      const userId = "test-user";

      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockResolvedValue({
        categoryKey: "nonexistent",
        confidence: 0.5,
        reasoning: "Unknown category",
      });

      (CategoryService.getCategoryByKey as any).mockResolvedValue(null); // Category not found

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
      })) as any;

      // Act
      await service.categorizeTransactionInBackground(transactionId, description, userId);

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Assert - Should still mark as completed
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          categorization_status: "completed",
        })
      );
    });

    it("should mark as failed categorization when AI returns low confidence", async () => {
      // Arrange
      const transactionId = 42;
      const description = "Low confidence item";
      const userId = "test-user";

      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockResolvedValue({
        categoryKey: "other",
        confidence: 0.2, // Low confidence
        reasoning: "Uncertain categorization",
      });

      // Set global mock implementation
      vi.mocked(AiCategorizationService).mockImplementationOnce(function () {
        this.categorizeTransaction = aiInstance.categorizeTransaction;
      } as any);

      (CategoryService.getCategoryByKey as any).mockResolvedValue({
        id: 99,
        key: "other",
        name: "Other",
      });

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
      })) as any;

      // Re-create service with new mockSupabase
      service = new BackgroundCategorizationService(mockSupabase);

      // Act
      await service.categorizeTransactionInBackground(transactionId, description, userId);

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Assert - Should mark as_ai_categorized = false
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_ai_categorized: false,
          categorization_status: "completed",
        })
      );
    });

    it("should handle AI categorization failures gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const transactionId = 42;
      const description = "Error causing item";
      const userId = "test-user";

      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockRejectedValue(new Error("AI service error"));

      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
      })) as any;

      // Act
      await service.categorizeTransactionInBackground(transactionId, description, userId);

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Assert - Should still mark as completed and log error
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[Background]"), expect.anything());

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          categorization_status: "completed",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle database update failures gracefully", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const transactionId = 42;
      const description = "Database error item";
      const userId = "test-user";

      const mockAiService = AiCategorizationService as any;
      const aiInstance = new mockAiService();
      aiInstance.categorizeTransaction.mockResolvedValue({
        categoryKey: "dining",
        confidence: 0.95,
        reasoning: "Coffee",
      });

      vi.mocked(AiCategorizationService).mockImplementationOnce(function () {
        this.categorizeTransaction = aiInstance.categorizeTransaction;
      } as any);

      (CategoryService.getCategoryByKey as any).mockResolvedValue({
        id: 5,
        key: "dining",
        name: "Dining",
      });

      // Mock database error
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: { message: "Database error" } })),
          })),
        })),
      })) as any;

      // Re-create service with new mockSupabase
      service = new BackgroundCategorizationService(mockSupabase);

      // Act
      await service.categorizeTransactionInBackground(transactionId, description, userId);

      // Wait for background task
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Assert - Should log error about database update failure
      const errorCalls = consoleSpy.mock.calls.filter(
        (call) => call[0]?.includes?.("Failed to update transaction") || call[0]?.includes?.("[Background]")
      );
      expect(errorCalls.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });
});
