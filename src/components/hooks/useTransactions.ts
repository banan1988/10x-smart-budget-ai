import { useState, useEffect, useCallback } from "react";
import type { TransactionVM, TransactionFilters, PaginatedResponse, TransactionDto } from "@/types";
import { UNCATEGORIZED_CATEGORY_NAME, UNCATEGORIZED_CATEGORY_KEY } from "@/types";

interface UseTransactionsReturn {
  transactions: TransactionVM[];
  pagination: PaginatedResponse<TransactionDto>["pagination"] | null;
  filters: TransactionFilters;
  isLoading: boolean;
  error: Error | null;
  setFilters: (filters: TransactionFilters) => void;
  setPage: (page: number) => void;
  refetch: () => void;
}

/**
 * Format amount as currency string
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount / 100); // Amount is stored in cents
}

/**
 * Format date to Polish locale
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Map TransactionDto to TransactionVM
 */
function mapToViewModel(dto: TransactionDto): TransactionVM {
  return {
    id: dto.id,
    type: dto.type,
    amount: formatAmount(dto.amount),
    description: dto.description,
    date: formatDate(dto.date),
    rawDate: dto.date, // Keep original YYYY-MM-DD format for editing
    categoryName: dto.category?.name || UNCATEGORIZED_CATEGORY_NAME,
    categoryKey: dto.category?.key || UNCATEGORIZED_CATEGORY_KEY,
    isAiCategorized: dto.is_ai_categorized,
    categorizationStatus: dto.categorization_status,
  };
}

/**
 * Custom hook for managing transactions state and API calls
 */
export function useTransactions(initialMonth?: string): UseTransactionsReturn {
  const currentMonth = initialMonth || new Date().toISOString().slice(0, 7);

  const [transactions, setTransactions] = useState<TransactionVM[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<TransactionDto>["pagination"] | null>(null);
  const [filters, setFiltersState] = useState<TransactionFilters>({
    month: currentMonth,
    page: 1,
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("month", filters.month);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.type) params.append("type", filters.type);
      if (filters.categoryId && filters.categoryId.length > 0) {
        params.append("categoryId", filters.categoryId.join(","));
      }
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        credentials: "include",
      });

      console.log("Fetch response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data: PaginatedResponse<TransactionDto> = await response.json();

      console.log("Fetched transactions:", data);

      // Map DTOs to ViewModels
      const viewModels = data.data.map(mapToViewModel);

      setTransactions(viewModels);
      setPagination(data.pagination);
    } catch (err) {
      console.error("useTransactions error:", err);
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Auto-refresh when there are pending categorizations
  useEffect(() => {
    const hasPending = transactions.some((t) => t.categorizationStatus === "pending");

    if (!hasPending) return;

    // Poll for updates every 2 seconds while there are pending categorizations
    const interval = setInterval(() => {
      fetchTransactions();
    }, 2000);

    return () => clearInterval(interval);
  }, [transactions, fetchTransactions]);

  const setFilters = useCallback((newFilters: TransactionFilters) => {
    setFiltersState(newFilters);
  }, []);

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page }));
  }, []);

  const refetch = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    pagination,
    filters,
    isLoading,
    error,
    setFilters,
    setPage,
    refetch,
  };
}
