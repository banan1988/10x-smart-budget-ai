import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDashboardStats } from './useDashboardStats';
import type { TransactionStatsDto } from '@/types';

describe('useDashboardStats', () => {
  const mockStatsDto: TransactionStatsDto = {
    month: '2025-11',
    totalIncome: 1000000, // 10000.00 PLN in cents
    totalExpenses: 250000, // 2500.00 PLN in cents
    balance: 750000, // 7500.00 PLN in cents
    transactionCount: 10,
    categoryBreakdown: [
      {
        categoryId: 1,
        categoryName: 'Jedzenie',
        total: 150000,
        count: 5,
        percentage: 60,
      },
      {
        categoryId: 2,
        categoryName: 'Transport',
        total: 100000,
        count: 3,
        percentage: 40,
      },
    ],
    dailyBreakdown: [
      { date: '2025-11-01', income: 500000, expenses: 100000 },
      { date: '2025-11-02', income: 0, expenses: 50000 },
      { date: '2025-11-03', income: 500000, expenses: 100000 },
    ],
    aiCategorizedCount: 8,
    manualCategorizedCount: 2,
    aiSummary: 'W listopadzie Twoje saldo jest pozytywne...',
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and map dashboard stats correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsDto,
    });

    const { result } = renderHook(() => useDashboardStats('2025-11'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.metrics).toHaveLength(3);
    expect(result.current.data?.metrics[0].title).toBe('Przychody');
    expect(result.current.data?.metrics[0].value).toContain('10');
    expect(result.current.data?.metrics[0].variant).toBe('income');
    expect(result.current.data?.metrics[1].title).toBe('Wydatki');
    expect(result.current.data?.metrics[1].variant).toBe('expense');
    expect(result.current.data?.metrics[2].title).toBe('Bilans');
    expect(result.current.data?.metrics[2].value).toContain('+'); // Positive balance should have + sign
    expect(result.current.data?.metrics[2].variant).toBe('balance-positive');
    expect(result.current.data?.categoryBreakdown).toHaveLength(2);
    expect(result.current.data?.dailyBreakdown).toHaveLength(3);
    expect(result.current.data?.dailyBreakdown[0].date).toBe('2025-11-01');
    expect(result.current.data?.dailyBreakdown[0].day).toBe('1');
    expect(result.current.data?.dailyBreakdown[0].income).toBe(5000); // 500000 cents = 5000 PLN
    expect(result.current.data?.dailyBreakdown[0].expenses).toBe(1000); // 100000 cents = 1000 PLN
    expect(result.current.data?.aiSummary).toBe('W listopadzie Twoje saldo jest pozytywne...');
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useDashboardStats('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain('Failed to fetch stats');
  });

  it('should call fetch with correct parameters', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsDto,
    });

    renderHook(() => useDashboardStats('2025-11'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/transactions/stats?month=2025-11&includeAiSummary=true')
      );
    });
  });

  it('should refetch data when refetch is called', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockStatsDto,
    });

    const { result } = renderHook(() => useDashboardStats('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should map all categories from backend', async () => {
    const statsWithManyCategories: TransactionStatsDto = {
      ...mockStatsDto,
      categoryBreakdown: [
        { categoryId: 1, categoryName: 'Cat1', total: 600000, count: 1, percentage: 20 },
        { categoryId: 2, categoryName: 'Cat2', total: 500000, count: 1, percentage: 20 },
        { categoryId: 3, categoryName: 'Cat3', total: 400000, count: 1, percentage: 20 },
        { categoryId: 4, categoryName: 'Cat4', total: 300000, count: 1, percentage: 20 },
        { categoryId: 5, categoryName: 'Cat5', total: 200000, count: 1, percentage: 20 },
        { categoryId: 6, categoryName: 'Cat6', total: 100000, count: 1, percentage: 20 },
        { categoryId: 7, categoryName: 'Cat7', total: 50000, count: 1, percentage: 20 },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithManyCategories,
    });

    const { result } = renderHook(() => useDashboardStats('2025-11'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // All categories should be returned, not just top 5
    expect(result.current.data?.categoryBreakdown).toHaveLength(7);
    expect(result.current.data?.categoryBreakdown[0].name).toBe('Cat1');
    expect(result.current.data?.categoryBreakdown[6].name).toBe('Cat7');
  });
});

