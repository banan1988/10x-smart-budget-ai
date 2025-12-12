import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiStatsAdmin } from './useAiStatsAdmin';

describe('useAiStatsAdmin hook', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.spyOn to properly mock fetch with mockRestore() support
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(vi.fn());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should initialize with default date range (last 30 days)', async () => {
    const mockData = {
      period: { startDate: '', endDate: '' },
      overall: { totalTransactions: 0, aiCategorized: 0, manuallyCategorized: 0, aiPercentage: 0 },
      categoryBreakdown: [],
      trendData: [],
    };

    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    expect(result.current.dateRange).toBeDefined('Date range should be initialized');
    expect(result.current.dateRange.startDate).toBeDefined('Start date should be defined');
    expect(result.current.dateRange.endDate).toBeDefined('End date should be defined');

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.isLoading).toBe(false, 'Should finish loading after fetch');
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
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockStats),
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.stats).toEqual(mockStats, 'Stats should match fetched data');
    expect(result.current.error).toBeNull('Error should be null on successful fetch');
    expect(fetchSpy).toHaveBeenCalledTimes(1, 'Fetch should be called once on mount');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/ai-stats'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Server error';
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ error: errorMessage }),
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Error should be defined on API failure');
    expect(result.current.error?.message).toContain(
      errorMessage,
      'Error message should contain server error'
    );
    expect(result.current.stats).toBeNull('Stats should be null on error');
    expect(result.current.isLoading).toBe(false, 'Loading should be false after error');
  });

  it('should update date range and refetch', async () => {
    const initialStats = {
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

    const updatedStats = {
      ...initialStats,
      period: { startDate: '2025-10-01', endDate: '2025-11-01' },
      overall: { ...initialStats.overall, totalTransactions: 50 },
    };

    // First call on mount, second call after date range change
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(initialStats),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(updatedStats),
      } as Response);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.stats).toEqual(initialStats, 'Should load initial stats');

    const newDateRange = {
      startDate: '2025-10-01',
      endDate: '2025-11-01',
    };

    act(() => {
      result.current.setDateRange(newDateRange);
    });

    await waitFor(
      () => {
        expect(result.current.stats?.overall.totalTransactions).toBe(50);
      },
      { timeout: 1000 }
    );

    expect(result.current.dateRange).toEqual(
      newDateRange,
      'Date range should be updated'
    );
    expect(result.current.stats).toEqual(updatedStats, 'Stats should be updated after date range change');
    // Account for possible extra calls due to useEffect dependency tracking
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(
      2,
      'Should fetch at least twice (mount and date range change)'
    );
  });

  it('should export data to CSV with proper formatting', async () => {
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
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockStats),
    } as Response;

    fetchSpy.mockResolvedValueOnce(mockResponse);

    // Mock document methods
    const mockAppendChild = vi.spyOn(document.body, 'appendChild');
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild');
    const mockCreateElement = vi.spyOn(document, 'createElement');
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');

    try {
      const { result } = renderHook(() => useAiStatsAdmin());

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 1000 }
      );

      expect(result.current.stats).not.toBeNull('Stats should be loaded before export');

      // Reset mocks after hook mount to focus on export behavior
      mockCreateElement.mockClear();
      mockAppendChild.mockClear();
      mockRemoveChild.mockClear();

      // Test CSV export
      act(() => {
        result.current.exportToCSV('test.csv');
      });

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    } finally {
      // Cleanup - ensure spies are restored even if test fails
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
      mockCreateElement.mockRestore();
      mockCreateObjectURL.mockRestore();
    }
  });

  it('should refetch with current date range', async () => {
    const mockStats = {
      period: { startDate: '2025-11-01', endDate: '2025-12-01' },
      overall: { totalTransactions: 100, aiCategorized: 80, manuallyCategorized: 20, aiPercentage: 80 },
      categoryBreakdown: [],
      trendData: [],
    };

    // First call on mount, second call on refetch
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(mockStats),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(mockStats),
      } as Response);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    const initialFetchCount = fetchSpy.mock.calls.length;

    act(() => {
      result.current.refetch();
    });

    await waitFor(
      () => {
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialFetchCount);
      },
      { timeout: 1000 }
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2, 'Fetch should be called once on mount and once on refetch');
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network error');
    fetchSpy.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Error should be defined on network failure');
    expect(result.current.error?.message).toContain('Network error', 'Error message should contain network error');
    expect(result.current.stats).toBeNull('Stats should be null on network error');
    expect(result.current.isLoading).toBe(false, 'Loading should be false after error');
  });

  it('should initialize with provided initial date range', async () => {
    const mockData = {
      period: { startDate: '2025-10-01', endDate: '2025-10-31' },
      overall: { totalTransactions: 50, aiCategorized: 40, manuallyCategorized: 10, aiPercentage: 80 },
      categoryBreakdown: [],
      trendData: [],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response);

    const initialDateRange = { startDate: '2025-10-01', endDate: '2025-10-31' };
    const { result } = renderHook(() => useAiStatsAdmin(initialDateRange));

    expect(result.current.dateRange).toEqual(
      initialDateRange,
      'Should initialize with provided date range'
    );

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('startDate=2025-10-01'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('should handle non-JSON response gracefully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'text/html']]),
      text: async () => '<html>Not JSON</html>',
    } as Response);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Error should be defined for non-JSON response');
    expect(result.current.error?.message).toContain('Invalid response format', 'Error message should indicate invalid format');
    expect(result.current.stats).toBeNull('Stats should be null on invalid response');
  });

  it('should handle malformed JSON response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => '{invalid json}',
    } as Response);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Error should be defined for malformed JSON');
    expect(result.current.error?.message).toContain('Invalid response format', 'Error message should indicate invalid JSON');
    expect(result.current.stats).toBeNull('Stats should be null on malformed JSON');
  });

  it('should not throw error when exporting without stats', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ error: 'Server error' }),
    } as Response);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    // Spy on console.warn - use vi.spyOn with proper mocking
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

    expect(() => {
      result.current.exportToCSV();
    }).not.toThrow('Export should not throw even without stats');

    expect(warnSpy).toHaveBeenCalledWith('No stats data to export');

    warnSpy.mockRestore();
  });

  it('should handle 401 unauthorized error', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ error: 'Unauthorized access' }),
    } as Response);

    const { result } = renderHook(() => useAiStatsAdmin());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Error should be defined on 401');
    expect(result.current.error?.message).toContain('Unauthorized access', 'Error message should contain authorization error');
    expect(result.current.stats).toBeNull('Stats should be null on unauthorized error');
  });

  it('should refetch if date range is set even with same values', async () => {
    const mockData = {
      period: { startDate: '2025-11-01', endDate: '2025-12-01' },
      overall: { totalTransactions: 100, aiCategorized: 80, manuallyCategorized: 20, aiPercentage: 80 },
      categoryBreakdown: [],
      trendData: [],
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response);

    const initialDateRange = { startDate: '2025-11-01', endDate: '2025-12-01' };
    const { result } = renderHook(() => useAiStatsAdmin(initialDateRange));

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    const initialCallCount = fetchSpy.mock.calls.length;

    // Set same date range - should still trigger refetch
    act(() => {
      result.current.setDateRange(initialDateRange);
    });

    await waitFor(
      () => {
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
      },
      { timeout: 1000 }
    );

    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(
      initialCallCount + 1,
      'Should fetch at least once after setDateRange is called'
    );
  });
});

