import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions } from './useTransactions';
import type { PaginatedResponse, TransactionDto } from '@/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockTransactionDto: TransactionDto = {
    id: 1,
    type: 'expense',
    amount: 5000, // 50.00 PLN in cents
    description: 'Test transaction',
    date: '2025-11-15',
    is_ai_categorized: true,
    category: {
      id: 1,
      key: 'groceries',
      name: 'Zakupy spożywcze',
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

  it('should fetch transactions on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/transactions?month=2025-11')
    );
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].description).toBe('Test transaction');
  });

  it('should format amount correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Amount should be formatted as currency (5000 cents = 50.00 PLN)
    expect(result.current.transactions[0].amount).toMatch(/50[,.]00/);
  });

  it('should format date correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Date should be formatted in Polish locale
    expect(result.current.transactions[0].date).toContain('listopada');
  });

  it('should include rawDate for editing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions[0].rawDate).toBe('2025-11-15');
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Failed to fetch transactions');
  });

  it('should update filters correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update filters
    result.current.setFilters({
      month: '2025-12',
      type: 'income',
      search: 'test',
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('month=2025-12')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=income')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      );
    });
  });

  it('should update page correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change page
    result.current.setPage(2);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('should refetch transactions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Trigger refetch
    result.current.refetch();

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should use default month if not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should use current month (2025-11)
    const currentMonth = new Date().toISOString().slice(0, 7);
    expect(result.current.filters.month).toBe(currentMonth);
  });

  it('should handle categoryId filter as array', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPaginatedResponse,
    });

    const { result } = renderHook(() => useTransactions('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set multiple categories
    result.current.setFilters({
      month: '2025-11',
      categoryId: [1, 2, 3],
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('categoryId=1%2C2%2C3')
      );
    });
  });
});

