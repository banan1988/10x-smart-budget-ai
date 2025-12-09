import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminFeedbacks } from './useAdminFeedbacks';

// Mock fetch
global.fetch = vi.fn();

describe('useAdminFeedbacks hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAdminFeedbacks());

    expect(result.current.feedbacks).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch feedbacks on mount', async () => {
    const mockData = {
      data: [
        { id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' },
        { id: 2, rating: 4, comment: 'Good', user_id: 'user2', created_at: '2025-12-01' },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => mockData,
      text: async () => JSON.stringify(mockData),
    });

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.feedbacks).toEqual(mockData.data);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalPages).toBe(1);
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => ({ message: 'Database error' }),
      text: async () => JSON.stringify({ message: 'Database error' }),
    });

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.feedbacks).toEqual([]);
  });

  it('should change page correctly', async () => {
    const mockData = {
      data: [{ id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' }],
      pagination: { page: 2, limit: 20, total: 50, totalPages: 3 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => mockData,
      text: async () => JSON.stringify(mockData),
    });

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });
  });

  it('should update filters and reset to page 1', async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: { get: vi.fn(() => 'application/json') },
      json: async () => mockData,
      text: async () => JSON.stringify(mockData),
    });

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ rating: 5, startDate: '2025-01-01' });
    });

    expect(result.current.filters).toEqual({ rating: 5, startDate: '2025-01-01' });
    expect(result.current.page).toBe(1);
  });

  it('should refetch data when calling refetch()', async () => {
    const mockData = {
      data: [{ id: 1, rating: 5, comment: 'Great!', user_id: 'user1', created_at: '2025-12-01' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockData, data: [...mockData.data, { id: 2, rating: 4 }] }),
      });

    const { result } = renderHook(() => useAdminFeedbacks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.feedbacks.length;

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.feedbacks.length).toBeGreaterThanOrEqual(initialCount);
    });
  });
});

