import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiStatsAdmin } from './useAiStatsAdmin';

// Mock fetch
global.fetch = vi.fn();

describe('useAiStatsAdmin hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default date range (last 30 days)', () => {
    const mockResponse = {
      ok: true,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => ({
        period: { startDate: '', endDate: '' },
        overall: { totalTransactions: 0, aiCategorized: 0, manuallyCategorized: 0, aiPercentage: 0 },
        categoryBreakdown: [],
        trendData: [],
      }),
      text: async () => '{}',
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    expect(result.current.dateRange).toBeDefined();
    expect(result.current.dateRange.startDate).toBeDefined();
    expect(result.current.dateRange.endDate).toBeDefined();
  });

  it('should fetch stats on mount', async () => {
    const mockStats = {
      period: { startDate: '2025-11-01', endDate: '2025-12-01' },
      overall: {
        totalTransactions: 100,
        aiCategorized: 80,
        manuallyCategorized: 20,
        aiPercentage: 80,
      },
      categoryBreakdown: [
        {
          categoryId: 1,
          categoryName: 'Food',
          categoryKey: 'food',
          aiCount: 40,
          manualCount: 10,
          total: 50,
          aiPercentage: 80,
        },
      ],
      trendData: [
        { date: '2025-11-01', percentage: 75 },
        { date: '2025-11-02', percentage: 80 },
      ],
    };

    const mockResponse = {
      ok: true,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => mockStats,
      text: async () => JSON.stringify(mockStats),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    const mockResponse = {
      ok: false,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => ({ error: 'Server error' }),
      text: async () => JSON.stringify({ error: 'Server error' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.stats).toBeNull();
  });

  it('should update date range and refetch', async () => {
    const mockStats = {
      period: { startDate: '2025-11-01', endDate: '2025-12-01' },
      overall: {
        totalTransactions: 100,
        aiCategorized: 80,
        manuallyCategorized: 20,
        aiPercentage: 80,
      },
      categoryBreakdown: [],
      trendData: [],
    };

    const mockResponse = {
      ok: true,
      json: async () => mockStats,
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
    });

    const initialFetchCount = (global.fetch as any).mock.calls.length;

    // Change date range
    act(() => {
      result.current.setDateRange({
        startDate: '2025-10-01',
        endDate: '2025-11-01',
      });
    });

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(initialFetchCount);
    });
  });

  it('should export data to CSV', async () => {
    const mockStats = {
      period: { startDate: '2025-11-01', endDate: '2025-12-01' },
      overall: {
        totalTransactions: 100,
        aiCategorized: 80,
        manuallyCategorized: 20,
        aiPercentage: 80,
      },
      categoryBreakdown: [
        {
          categoryId: 1,
          categoryName: 'Food',
          categoryKey: 'food',
          aiCount: 40,
          manualCount: 10,
          total: 50,
          aiPercentage: 80,
        },
      ],
      trendData: [],
    };

    const mockResponse = {
      ok: true,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => mockStats,
      text: async () => JSON.stringify(mockStats),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    // Wait for stats to load
    await waitFor(() => {
      expect(result.current.stats).not.toBeNull();
      expect(result.current.stats?.categoryBreakdown).toBeDefined();
    });

    // Test that exportToCSV doesn't throw error
    expect(() => {
      result.current.exportToCSV('test.csv');
    }).not.toThrow();

    // Verify stats loaded correctly
    expect(result.current.stats).not.toBeNull();
    if (result.current.stats) {
      expect(result.current.stats.categoryBreakdown.length).toBeGreaterThan(0);
    }
  });

  it('should refetch with current date range', async () => {
    const mockStats = {
      period: { startDate: '2025-11-01', endDate: '2025-12-01' },
      overall: { totalTransactions: 100, aiCategorized: 80, manuallyCategorized: 20, aiPercentage: 80 },
      categoryBreakdown: [],
      trendData: [],
    };

    const mockResponse = {
      ok: true,
      json: async () => mockStats,
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
    });

    const initialFetchCount = (global.fetch as any).mock.calls.length;

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(initialFetchCount);
    });
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
  });
});

