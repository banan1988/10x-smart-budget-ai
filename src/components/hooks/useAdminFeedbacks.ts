import { useState, useCallback, useEffect, useRef } from "react";
import type { FeedbackDto, FeedbackFilters, AdminFeedbacksResponse } from "../../types";

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

  // Track previous query params to avoid infinite loops
  const prevParamsRef = useRef<string>("");

  // Build query parameters from filters and current page
  const buildQueryParams = useCallback((): string => {
    const params = new URLSearchParams();

    if (state.filters.startDate) {
      params.append("startDate", state.filters.startDate);
    }
    if (state.filters.endDate) {
      params.append("endDate", state.filters.endDate);
    }
    if (state.filters.rating) {
      params.append("rating", state.filters.rating.toString());
    }
    params.append("page", state.page.toString());
    params.append("limit", "20");

    return params.toString();
  }, [state.filters, state.page]);

  // Fetch feedbacks from API
  const fetchFeedbacks = useCallback(async (queryString: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/admin/feedbacks?${queryString}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Failed to fetch feedbacks: ${response.statusText}`;

        // Read body once to avoid "body stream already read" error
        const bodyText = await response.text();

        if (contentType?.includes("application/json")) {
          try {
            const errorData = JSON.parse(bodyText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If JSON parsing fails, use the text as-is
            errorMessage = bodyText.substring(0, 200) || errorMessage;
          }
        } else {
          // Log non-JSON response for debugging
          // eslint-disable-next-line no-console
          console.error("Non-JSON response from /api/admin/feedbacks:", bodyText.substring(0, 200));
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      // eslint-disable-next-line no-console
      console.log("[useAdminFeedbacks] Response status:", response.status, "Content-Type:", contentType);

      // Try to parse JSON
      let data: AdminFeedbacksResponse;
      try {
        const responseText = await response.text();
        // eslint-disable-next-line no-console
        console.log("[useAdminFeedbacks] Response body (first 500 chars):", responseText.substring(0, 500));
        data = JSON.parse(responseText);
      } catch (parseErr) {
        // eslint-disable-next-line no-console
        console.error("[useAdminFeedbacks] Failed to parse response as JSON:", parseErr);
        throw new Error("Invalid response format: server did not return valid JSON");
      }

      setState((prev) => ({
        ...prev,
        feedbacks: data.data,
        totalCount: data.pagination.total,
        totalPages: data.pagination.totalPages,
        page: data.pagination.page,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      // eslint-disable-next-line no-console
      console.error("Error fetching feedbacks:", errorMessage);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  }, []);

  // Fetch on mount and when query parameters actually change
  useEffect(() => {
    // Build query string directly in effect to avoid dependency issues
    const params = new URLSearchParams();

    if (state.filters.startDate) {
      params.append("startDate", state.filters.startDate);
    }
    if (state.filters.endDate) {
      params.append("endDate", state.filters.endDate);
    }
    if (state.filters.rating) {
      params.append("rating", state.filters.rating.toString());
    }
    params.append("page", state.page.toString());
    params.append("limit", "20");

    const queryString = params.toString();
    // eslint-disable-next-line no-console
    console.log("[useAdminFeedbacks] Query params changed:", queryString);

    // Only fetch if query params have actually changed
    if (queryString !== prevParamsRef.current) {
      prevParamsRef.current = queryString;
      // eslint-disable-next-line no-console
      console.log("[useAdminFeedbacks] Fetching feedbacks with params:", queryString);
      fetchFeedbacks(queryString);
    }
  }, [state.filters.startDate, state.filters.endDate, state.filters.rating, state.page, fetchFeedbacks]);

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
    const queryString = buildQueryParams();
    fetchFeedbacks(queryString);
  }, [buildQueryParams, fetchFeedbacks]);

  return {
    ...state,
    setPage,
    setFilters,
    refetch,
  };
}
