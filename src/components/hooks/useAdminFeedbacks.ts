import { useState, useCallback, useEffect } from 'react';
import type { FeedbackDto, FeedbackFilters, AdminFeedbacksResponse } from '../../types';

export interface UseAdminFeedbacksState {
  feedbacks: FeedbackDto[];
  totalCount: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: FeedbackFilters;
}

export interface UseAdminFeedbacksActions {
  setPage: (page: number) => void;
  setFilters: (filters: FeedbackFilters) => void;
  refetch: () => void;
}

/**
 * Custom hook for managing admin feedbacks data fetching and filtering
 * Handles state, API calls, pagination, and filtering logic
 */
export function useAdminFeedbacks(initialFilters?: FeedbackFilters) {
  const [state, setState] = useState<UseAdminFeedbacksState>({
    feedbacks: [],
    totalCount: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    error: null,
    filters: initialFilters || {},
  });

  // Build query parameters from filters and current page
  const buildQueryParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams();

    if (state.filters.startDate) {
      params.append('startDate', state.filters.startDate);
    }
    if (state.filters.endDate) {
      params.append('endDate', state.filters.endDate);
    }
    if (state.filters.rating) {
      params.append('rating', state.filters.rating.toString());
    }
    params.append('page', state.page.toString());
    params.append('limit', '20');

    return params;
  }, [state.filters, state.page]);

  // Fetch feedbacks from API
  const fetchFeedbacks = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = buildQueryParams();
      const response = await fetch(`/api/admin/feedbacks?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch feedbacks: ${response.statusText}`
        );
      }

      const data: AdminFeedbacksResponse = await response.json();

      setState((prev) => ({
        ...prev,
        feedbacks: data.data,
        totalCount: data.pagination.total,
        totalPages: data.pagination.totalPages,
        page: data.pagination.page,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching feedbacks:', errorMessage);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, [buildQueryParams]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Update page number
  const setPage = useCallback((page: number) => {
    setState((prev) => {
      const newPage = Math.max(1, Math.min(page, prev.totalPages || 1));
      if (newPage === prev.page) return prev;
      return { ...prev, page: newPage };
    });
  }, []);

  // Update filters and reset to page 1
  const setFilters = useCallback((filters: FeedbackFilters) => {
    setState((prev) => ({
      ...prev,
      filters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  // Manual refetch
  const refetch = useCallback(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  return {
    ...state,
    setPage,
    setFilters,
    refetch,
  };
}

