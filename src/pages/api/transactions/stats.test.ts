import { describe, it, expect, vi, afterEach } from "vitest";
import type { APIContext } from "astro";
import { GET } from "./stats";
import { createMockAPIContext } from "../../../test/mocks/astro.mock";
import { createMockSupabaseClient } from "../../../test/mocks/supabase.mock";

// Mock TransactionService at top level
vi.mock("../../../lib/services/transaction.service", () => ({
  TransactionService: {
    getStats: vi.fn(),
  },
}));

describe("GET /api/transactions/stats", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    const context = createMockAPIContext({
      locals: { supabase: createMockSupabaseClient() },
      url: new URL("http://localhost:4321/api/transactions/stats?month=2025-11"),
    });

    const response = await GET(context as APIContext);

    expect(response.status).toBe(401);
  });

  it("should return 200 with stats for authenticated user", async () => {
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: mockSupabase,
      },
      url: new URL("http://localhost:4321/api/transactions/stats?month=2025-11"),
    });

    const { TransactionService } = await import("../../../lib/services/transaction.service");
    vi.mocked(TransactionService.getStats).mockResolvedValue({
      totalIncome: 5000,
      totalExpenses: 1500,
      balance: 3500,
      transactionCount: 25,
      byCategory: [
        { category: "Food", amount: 500, percentage: 33 },
        { category: "Transport", amount: 400, percentage: 27 },
      ],
    } as Record<string, unknown>);

    const response = await GET(context as APIContext);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("totalIncome");
    expect(data).toHaveProperty("totalExpenses");
    expect(data).toHaveProperty("balance");
  });

  it("should accept month parameter in YYYY-MM format", async () => {
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: mockSupabase,
      },
      url: new URL("http://localhost:4321/api/transactions/stats?month=2025-11"),
    });

    const response = await GET(context as APIContext);

    expect(response.status).toBe(200);
  });

  it("should return 400 for invalid month format", async () => {
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      url: new URL("http://localhost:4321/api/transactions/stats?month=11-2025"),
    });

    const response = await GET(context as APIContext);

    expect(response.status).toBe(400);
  });

  it("should accept categoryId filter parameter", async () => {
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: mockSupabase,
      },
      url: new URL("http://localhost:4321/api/transactions/stats?month=2025-11&categoryId=1,2,3"),
    });

    const response = await GET(context as APIContext);

    expect(response.status).toBe(200);
  });

  it("should include category breakdown in stats", async () => {
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: mockSupabase,
      },
      url: new URL("http://localhost:4321/api/transactions/stats?month=2025-11"),
    });

    const response = await GET(context as APIContext);
    const data = await response.json();

    expect(data).toHaveProperty("byCategory");
    expect(Array.isArray(data.byCategory)).toBe(true);
  });

  it("should return 500 on service error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // no-op
    });
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: mockSupabase,
      },
      url: new URL("http://localhost:4321/api/transactions/stats?month=2025-11"),
    });

    const { TransactionService } = await import("../../../lib/services/transaction.service");
    vi.mocked(TransactionService.getStats).mockRejectedValue(new Error("Service error"));

    const response = await GET(context as APIContext);

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
