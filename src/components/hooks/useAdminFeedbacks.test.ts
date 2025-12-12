import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminFeedbacks } from './useAdminFeedbacks';

describe('useAdminFeedbacks hook', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.spyOn to properly mock fetch with mockClear() support
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(vi.fn());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should initialize with default state', () => {
    // Mock fetch to avoid actual API calls
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    expect(result.current.feedbacks).toEqual([], 'Feedbacks should initialize as empty array');
    expect(result.current.totalCount).toBe(0, 'Total count should initialize as 0');
    expect(result.current.page).toBe(1, 'Page should initialize as 1');
    expect(result.current.isLoading).toBe(true, 'Loading state should be true on mount');
    expect(result.current.error).toBeNull('Error should be null initially');
  });

  it('should fetch feedbacks on mount', async () => {
    const mockData = {
      data: [
        { id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' },
        { id: 2, rating: 4, comment: 'Good', user_id: 'user2', created_at: '2025-12-01' },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.feedbacks).toEqual(
      mockData.data,
      'Should load feedbacks from API response'
    );
    expect(result.current.totalCount).toBe(2, 'Should set total count from pagination');
    expect(result.current.totalPages).toBe(1, 'Should set total pages from pagination');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/feedbacks'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Database error';
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ message: errorMessage }),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Error should be set on API failure');
    expect(result.current.feedbacks).toEqual([], 'Feedbacks should remain empty on error');
    expect(result.current.totalCount).toBe(0, 'Total count should remain 0 on error');
  });

  it('should change page correctly', async () => {
    const mockData = {
      data: [{ id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' }],
      pagination: { page: 2, limit: 20, total: 50, totalPages: 3 },
    };

    // First call on mount (page 1), second call after setPage (page 2)
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify({ ...mockData, pagination: { ...mockData.pagination, page: 1 } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(mockData),
      } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.page).toBe(1, 'Should initialize to page 1');

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(
      () => {
        expect(result.current.page).toBe(2);
      },
      { timeout: 1000 }
    );

    expect(result.current.page).toBe(2, 'Should update page to 2 after setPage(2)');
    expect(fetchSpy).toHaveBeenCalledTimes(2, 'Should fetch twice: mount and page change');
  });

  it('should update filters and reset to page 1', async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };

    // First call on mount, second call after filter change
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(mockData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(mockData),
      } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    act(() => {
      result.current.setFilters({ rating: 5, startDate: '2025-01-01' });
    });

    expect(result.current.filters).toEqual(
      { rating: 5, startDate: '2025-01-01' },
      'Should update filters with provided values'
    );
    expect(result.current.page).toBe(1, 'Should reset to page 1 when filters change');
  });


  it('should initialize with provided filters', () => {
    // Mock fetch to avoid actual API calls
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
    } as Response);

    const initialFilters = { rating: 5, startDate: '2025-01-01' };
    const { result } = renderHook(() => useAdminFeedbacks(initialFilters));

    expect(result.current.filters).toEqual(
      initialFilters,
      'Should initialize with provided filters'
    );
    expect(result.current.page).toBe(1, 'Should start with page 1');
  });

  it('should handle page boundary validation', async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    // Try to set page 0 - should not allow
    act(() => {
      result.current.setPage(0);
    });

    expect(result.current.page).toBe(
      1,
      'Should not allow page less than 1'
    );

    // Try to set page beyond max - should be limited
    act(() => {
      result.current.setPage(10);
    });

    expect(result.current.page).toBeLessThanOrEqual(
      result.current.totalPages,
      'Should not allow page greater than total pages'
    );
  });

  it('should handle network error gracefully', async () => {
    const networkError = new Error('Network error');
    fetchSpy.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Should set error on network failure');
    expect(result.current.feedbacks).toEqual([], 'Should keep feedbacks empty on network error');
    expect(result.current.isLoading).toBe(
      false,
      'Should stop loading on network error'
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

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Should set error for non-JSON response');
    expect(result.current.feedbacks).toEqual(
      [],
      'Should keep feedbacks empty for non-JSON response'
    );
  });

  it('should refetch data when calling refetch()', async () => {
    const initialMockData = {
      data: [{ id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    const updatedMockData = {
      data: [
        { id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' },
        { id: 2, rating: 4, comment: 'Good', user_id: 'user2', created_at: '2025-12-02' },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(initialMockData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(updatedMockData),
      } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.feedbacks.length).toBe(
      1,
      'Should load initial data with 1 feedback'
    );

    act(() => {
      result.current.refetch();
    });

    await waitFor(
      () => {
        expect(result.current.feedbacks.length).toBe(2);
      },
      { timeout: 1000 }
    );

    expect(result.current.feedbacks.length).toBe(
      2,
      'Should update data after refetch with 2 feedbacks'
    );
    expect(result.current.totalCount).toBe(
      2,
      'Should update total count after refetch'
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2, 'Should fetch twice: mount and refetch');
  });

  it('should not refetch if page value does not change', async () => {
    const mockData = {
      data: [{ id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    const initialCallCount = fetchSpy.mock.calls.length;

    // Try to set same page
    act(() => {
      result.current.setPage(1);
    });

    // Should not trigger new fetch since page is already 1
    expect(fetchSpy.mock.calls.length).toBe(
      initialCallCount,
      'Should not fetch again when page does not change'
    );
  });

  it('should handle multiple filter updates correctly', async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };

    // Fetch calls: mount, first filter set, second filter set
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify(mockData),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    act(() => {
      result.current.setFilters({ rating: 5 });
    });

    await waitFor(
      () => {
        expect(result.current.filters).toEqual({ rating: 5 });
      },
      { timeout: 1000 }
    );

    act(() => {
      result.current.setFilters({ rating: 5, startDate: '2025-01-01' });
    });

    expect(result.current.filters).toEqual(
      { rating: 5, startDate: '2025-01-01' },
      'Should merge and update filters correctly'
    );
    expect(result.current.page).toBe(1, 'Should reset page to 1 on each filter change');
  });

  it('should handle 401 unauthorized error', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ error: 'Unauthorized access' }),
    } as Response);

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.error).toBeTruthy('Should set error for unauthorized access');
    expect(result.current.error).toBe(
      'Unauthorized access',
      'Error message should contain the API error message'
    );
  });
});

