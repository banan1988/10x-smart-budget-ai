import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTransactions } from "./useTransactions";
import type { PaginatedResponse, TransactionDto } from "@/types";

describe("useTransactions", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.spyOn to properly mock fetch with mockRestore() support
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(vi.fn());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const mockTransactionDto: TransactionDto = {
    id: 1,
    type: "expense",
    amount: 5000, // 50.00 PLN in cents
    description: "Test transaction",
    date: "2025-11-15",
    is_ai_categorized: true,
    category: {
      id: 1,
      key: "groceries",
      name: "Zakupy spożywcze",
    },
  };

  const mockPaginatedResponse: PaginatedResponse<TransactionDto> = {
    data: [mockTransactionDto],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  };

  it("should fetch transactions on mount", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockPaginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    expect(result.current.isLoading).toBe(true, "Should be loading initially");

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("/api/transactions?month=2025-11"), {
      credentials: "include",
    });
    expect(result.current.transactions).toHaveLength(1, "Should load one transaction");
    expect(result.current.transactions[0].description).toBe("Test transaction", "Transaction description should match");
  });

  it("should handle API errors", async () => {
    const errorMessage = "Internal Server Error";
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: errorMessage,
      headers: new Map([["content-type", "application/json"]]),
      text: async () => JSON.stringify({ error: errorMessage }),
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull("Error should be defined on API failure");
    expect(result.current.error?.message).toContain(
      "Failed to fetch transactions",
      "Error message should indicate fetch failure"
    );
    expect(result.current.transactions).toHaveLength(0, "Transactions should be empty on error");
  });

  it("should update filters correctly", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockPaginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update filters using act() for state changes
    act(() => {
      result.current.setFilters({
        month: "2025-12",
        type: "income",
        search: "test",
      });
    });

    await waitFor(() => {
      // Check the second call (first is initial load)
      expect(fetchSpy).toHaveBeenLastCalledWith(expect.stringContaining("month=2025-12"), { credentials: "include" });
    });

    expect(result.current.filters.month).toBe("2025-12", "Filter month should be updated");
    expect(result.current.filters.type).toBe("income", "Filter type should be updated");
    expect(result.current.filters.search).toBe("test", "Filter search should be updated");
  });

  it("should update page correctly", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockPaginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change page using act() for state changes
    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(expect.stringContaining("page=2"), { credentials: "include" });
    });

    expect(result.current.filters.page).toBe(2, "Page should be updated to 2");
  });

  it("should refetch transactions", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockPaginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = fetchSpy.mock.calls.length;

    // Trigger refetch using act()
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(
        initialCallCount,
        "Should make additional fetch call on refetch"
      );
    });
  });

  it("should use default month if not provided", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockPaginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should use current month (2025-12 based on context date)
    const currentMonth = new Date().toISOString().slice(0, 7);
    expect(result.current.filters.month).toBe(currentMonth, "Should use current month when none provided");
  });

  it("should handle categoryId filter as array", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => mockPaginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set multiple categories using act()
    act(() => {
      result.current.setFilters({
        month: "2025-11",
        categoryId: [1, 2, 3],
      });
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenLastCalledWith(expect.stringContaining("categoryId=1%2C2%2C3"), {
        credentials: "include",
      });
    });

    expect(result.current.filters.categoryId).toEqual([1, 2, 3], "Category filter should contain all provided IDs");
  });

  it("should handle network errors gracefully", async () => {
    const networkError = new Error("Network error");
    fetchSpy.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy("Error should be defined on network failure");
    expect(result.current.error?.message).toContain(
      "Network error",
      "Error message should contain network error details"
    );
    expect(result.current.transactions).toHaveLength(0, "Transactions should be empty on network error");
  });

  it("should handle non-JSON response gracefully", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "text/html"]]),
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy("Error should be defined for non-JSON response");
    expect(result.current.transactions).toHaveLength(0, "Transactions should be empty on invalid response");
  });

  it("should handle malformed JSON response", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy("Error should be defined for malformed JSON");
    expect(result.current.error?.message).toContain(
      "Unexpected token",
      "Error message should indicate JSON parsing error"
    );
  });

  it("should handle 401 unauthorized error", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Map([["content-type", "application/json"]]),
      text: async () => JSON.stringify({ error: "Unauthorized access" }),
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy("Error should be defined on 401 unauthorized");
    expect(result.current.error?.message).toContain(
      "Failed to fetch transactions",
      "Error message should indicate fetch failure"
    );
  });

  it("should handle empty transaction list", async () => {
    const emptyResponse: PaginatedResponse<TransactionDto> = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => emptyResponse,
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(0, "Should have empty transaction list");
    expect(result.current.pagination?.total).toBe(0, "Pagination total should be 0");
    expect(result.current.error).toBeNull("Error should be null for successful empty response");
  });

  it("should preserve pagination info", async () => {
    const paginatedResponse: PaginatedResponse<TransactionDto> = {
      data: [mockTransactionDto],
      pagination: {
        page: 2,
        limit: 50,
        total: 150,
        totalPages: 3,
      },
    };

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Map([["content-type", "application/json"]]),
      json: async () => paginatedResponse,
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useTransactions("2025-11"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pagination).toEqual(
      paginatedResponse.pagination,
      "Should preserve pagination info from response"
    );
    expect(result.current.pagination?.page).toBe(2, "Current page should be 2");
    expect(result.current.pagination?.totalPages).toBe(3, "Total pages should be 3");
  });
});
