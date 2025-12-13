import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardStats } from "./useDashboardStats";
import type { TransactionStatsDto } from "@/types";

describe("useDashboardStats", () => {
  const mockStatsDto: TransactionStatsDto = {
    month: "2025-11",
    totalIncome: 1000000, // 10000.00 PLN in cents
    totalExpenses: 250000, // 2500.00 PLN in cents
    balance: 750000, // 7500.00 PLN in cents
    transactionCount: 10,
    categoryBreakdown: [
      {
        categoryId: 1,
        categoryName: "Jedzenie",
        total: 150000,
        count: 5,
        percentage: 60,
      },
      {
        categoryId: 2,
        categoryName: "Transport",
        total: 100000,
        count: 3,
        percentage: 40,
      },
    ],
    dailyBreakdown: [
      { date: "2025-11-01", income: 500000, expenses: 100000 },
      { date: "2025-11-02", income: 0, expenses: 50000 },
      { date: "2025-11-03", income: 500000, expenses: 100000 },
    ],
    aiCategorizedCount: 8,
    manualCategorizedCount: 2,
    aiSummary: "W listopadzie Twoje saldo jest pozytywne...",
  };

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Use vi.spyOn to monitor fetch with proper mockRestore() support
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(vi.fn());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("should fetch and map dashboard stats correctly", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsDto,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    expect(result.current.isLoading).toBe(true, "Hook should be loading on initial render");
    expect(result.current.data).toBeNull("Data should be null initially");
    expect(result.current.error).toBeNull("Error should be null initially");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading after fetch");
    });

    expect(result.current.data).toBeDefined("Data should be defined after successful fetch");
    expect(result.current.data?.metrics).toHaveLength(
      3,
      "Should have exactly 3 metric cards (income, expenses, balance)"
    );
    expect(result.current.data?.metrics[0].title).toBe("Przychody");
    expect(result.current.data?.metrics[0].value).toContain("10");
    expect(result.current.data?.metrics[0].variant).toBe("income");
    expect(result.current.data?.metrics[1].title).toBe("Wydatki");
    expect(result.current.data?.metrics[1].value).toContain("2500", "Should format 250000 cents as 2500.00 PLN");
    expect(result.current.data?.metrics[1].variant).toBe("expense");
    expect(result.current.data?.metrics[2].title).toBe("Bilans");
    expect(result.current.data?.metrics[2].value).toContain("+");
    expect(result.current.data?.metrics[2].variant).toBe("balance-positive");
    expect(result.current.data?.categoryBreakdown).toHaveLength(2, "Should map all categories from backend");
    expect(result.current.data?.dailyBreakdown).toHaveLength(3, "Should map all daily entries");
    expect(result.current.data?.dailyBreakdown[0].date).toBe("2025-11-01");
    expect(result.current.data?.dailyBreakdown[0].day).toBe("1");
    expect(result.current.data?.dailyBreakdown[0].income).toBe(5000, "Should convert from cents to PLN");
    expect(result.current.data?.dailyBreakdown[0].expenses).toBe(1000, "Should convert from cents to PLN");
    expect(result.current.data?.aiSummary).toBe("W listopadzie Twoje saldo jest pozytywne...");
    expect(result.current.error).toBeNull("Error should be null after successful fetch");
  });

  it("should handle fetch error", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading after error");
    });

    expect(result.current.data).toBeNull("Data should be null on error");
    expect(result.current.error).toBeDefined("Error should be defined on fetch failure");
    expect(result.current.error?.message).toContain(
      "Failed to fetch stats",
      "Error message should contain specific text"
    );
  });

  it("should call fetch with correct parameters", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsDto,
    } as Response);

    renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const calls = fetchSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0, "Fetch should be called at least once");

    const firstCall = calls[0];
    const url = firstCall[0] as string;
    const options = firstCall[1] as RequestInit;

    expect(url).toContain("/api/transactions/stats", "URL should contain stats endpoint");
    expect(url).toContain("month=2025-11", "URL should include month parameter");
    expect(url).toContain("includeAiSummary=true", "URL should request AI summary");
    expect(options.credentials).toBe("include", "Fetch should include credentials for authentication");
  });

  it("should refetch data when refetch is called", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mockStatsDto,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Initial fetch should complete");
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1, "Fetch should be called once on mount");

    result.current.refetch();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2, "Fetch should be called again after refetch");
    });
  });

  it("should map all categories from backend", async () => {
    const statsWithManyCategories: TransactionStatsDto = {
      ...mockStatsDto,
      categoryBreakdown: [
        { categoryId: 1, categoryName: "Cat1", total: 600000, count: 1, percentage: 20 },
        { categoryId: 2, categoryName: "Cat2", total: 500000, count: 1, percentage: 20 },
        { categoryId: 3, categoryName: "Cat3", total: 400000, count: 1, percentage: 20 },
        { categoryId: 4, categoryName: "Cat4", total: 300000, count: 1, percentage: 20 },
        { categoryId: 5, categoryName: "Cat5", total: 200000, count: 1, percentage: 20 },
        { categoryId: 6, categoryName: "Cat6", total: 100000, count: 1, percentage: 20 },
        { categoryId: 7, categoryName: "Cat7", total: 50000, count: 1, percentage: 20 },
      ],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithManyCategories,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading");
    });

    // All categories should be returned, not just top 5
    expect(result.current.data?.categoryBreakdown).toHaveLength(7, "Should map all categories without limiting");
    expect(result.current.data?.categoryBreakdown[0].name).toBe("Cat1", "First category should be mapped correctly");
    expect(result.current.data?.categoryBreakdown[6].name).toBe("Cat7", "Last category should be mapped correctly");
  });

  it("should handle negative balance correctly", async () => {
    const statsWithNegativeBalance: TransactionStatsDto = {
      ...mockStatsDto,
      balance: -100000, // -1000.00 PLN
      totalExpenses: 1100000,
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithNegativeBalance,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading");
    });

    const balanceMetric = result.current.data?.metrics[2];
    expect(balanceMetric?.variant).toBe("balance-negative", "Should use balance-negative variant for negative balance");
    expect(balanceMetric?.value).not.toContain("+", "Negative balance should not have + sign");
  });

  it("should handle network errors gracefully", async () => {
    const networkError = new Error("Network request failed");
    fetchSpy.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading on error");
    });

    expect(result.current.data).toBeNull("Data should be null on network error");
    expect(result.current.error).toBeDefined("Error should be defined on network failure");
    expect(result.current.error?.message).toContain("Network request failed", "Should preserve network error message");
  });

  it("should handle json parsing error", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading on error");
    });

    expect(result.current.data).toBeNull("Data should be null on JSON parse error");
    expect(result.current.error).toBeDefined("Error should be defined on JSON parse failure");
  });

  it("should handle empty category breakdown", async () => {
    const statsWithNoCategories: TransactionStatsDto = {
      ...mockStatsDto,
      categoryBreakdown: [],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithNoCategories,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading");
    });

    expect(result.current.data?.categoryBreakdown).toHaveLength(0, "Should handle empty category breakdown");
    expect(result.current.error).toBeNull("Should not have error with empty categories");
  });

  it("should handle empty daily breakdown", async () => {
    const statsWithNoDailyData: TransactionStatsDto = {
      ...mockStatsDto,
      dailyBreakdown: [],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithNoDailyData,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading");
    });

    expect(result.current.data?.dailyBreakdown).toHaveLength(0, "Should handle empty daily breakdown");
    expect(result.current.error).toBeNull("Should not have error with empty daily data");
  });

  it("should convert amounts from cents to PLN correctly", async () => {
    const statsWithSpecificAmounts: TransactionStatsDto = {
      ...mockStatsDto,
      totalIncome: 123456, // 1234.56 PLN
      totalExpenses: 54321, // 543.21 PLN
      balance: 69135, // 691.35 PLN
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithSpecificAmounts,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading");
    });

    const metrics = result.current.data?.metrics;
    expect(metrics?.[0].value).toContain("1");
    expect(metrics?.[0].value).toContain("234");
    expect(metrics?.[1].value).toContain("543");
    expect(metrics?.[2].value).toContain("691");
  });

  it("should handle zero transaction count", async () => {
    const statsWithZeroTransactions: TransactionStatsDto = {
      ...mockStatsDto,
      transactionCount: 0,
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      categoryBreakdown: [],
      dailyBreakdown: [],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithZeroTransactions,
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading");
    });

    expect(result.current.data).toBeDefined("Should handle zero transactions gracefully");
    expect(result.current.data?.categoryBreakdown).toHaveLength(0);
    expect(result.current.data?.dailyBreakdown).toHaveLength(0);
    expect(result.current.error).toBeNull("Should not have error with zero transactions");
  });

  it("should handle 500 server error response", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading on error");
    });

    expect(result.current.data).toBeNull("Data should be null on server error");
    expect(result.current.error).toBeDefined("Error should be defined on 500 status");
    expect(result.current.error?.message).toContain(
      "Internal Server Error",
      "Should include status text in error message"
    );
  });

  it("should handle 404 not found error", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const { result } = renderHook(() => useDashboardStats("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false, "Hook should finish loading on error");
    });

    expect(result.current.data).toBeNull("Data should be null on 404");
    expect(result.current.error).toBeDefined("Error should be defined on 404");
  });
});
