/**
 * Mock data and factories for admin API tests
 *
 * Centralized location for test data used in admin endpoint tests.
 * Follows the DRY principle to avoid duplication across test files.
 */

/**
 * AI Stats Response Mock Factory
 */
export function createMockAiStatsResponse(overrides = {}) {
  return {
    period: {
      startDate: "2025-11-01",
      endDate: "2025-12-09",
    },
    overall: {
      totalTransactions: 150,
      aiCategorized: 120,
      manuallyCategorized: 30,
      aiPercentage: 80,
    },
    categoryBreakdown: [
      {
        categoryId: 1,
        categoryName: "Food",
        categoryKey: "food",
        aiCount: 45,
        manualCount: 5,
        total: 50,
        aiPercentage: 90,
      },
      {
        categoryId: 2,
        categoryName: "Transport",
        categoryKey: "transport",
        aiCount: 35,
        manualCount: 10,
        total: 45,
        aiPercentage: 77.78,
      },
      {
        categoryId: 3,
        categoryName: "Entertainment",
        categoryKey: "entertainment",
        aiCount: 25,
        manualCount: 10,
        total: 35,
        aiPercentage: 71.43,
      },
    ],
    trendData: [
      { date: "2025-11-01", percentage: 75 },
      { date: "2025-11-02", percentage: 78 },
      { date: "2025-11-03", percentage: 80 },
      { date: "2025-11-04", percentage: 82 },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
    },
    ...overrides,
  };
}

/**
 * Feedback Data Mock Factory
 */
export function createMockFeedbackData(count = 2, overrides = {}) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    rating: Math.floor(Math.random() * 5) + 1,
    comment: `Feedback ${i + 1} - Great application!`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 86400000).toISOString(),
    ...overrides,
  }));
}

/**
 * Feedback Response with Pagination
 */
export function createMockFeedbackResponse(count = 2, overrides = {}) {
  return {
    data: createMockFeedbackData(count),
    page: 1,
    limit: 20,
    total: count,
    ...overrides,
  };
}

/**
 * Sample data for date range boundary tests
 */
export const SAMPLE_DATES = {
  VALID_START: "2025-11-01",
  VALID_END: "2025-12-09",
  INVALID_FORMAT_1: "11-01-2025",
  INVALID_FORMAT_2: "invalid-date",
  REVERSED_START: "2025-12-09",
  REVERSED_END: "2025-11-01",
};

/**
 * Sample rating values for boundary tests
 */
export const SAMPLE_RATINGS = {
  VALID_MIN: 1,
  VALID_MAX: 5,
  INVALID_ZERO: 0,
  INVALID_NEGATIVE: -1,
  INVALID_HIGH: 6,
  INVALID_STRING: "five",
};

/**
 * Sample pagination values for boundary tests
 */
export const SAMPLE_PAGINATION = {
  VALID_PAGE_MIN: 1,
  VALID_PAGE_DEFAULT: 1,
  VALID_LIMIT_MIN: 1,
  VALID_LIMIT_DEFAULT: 20,
  VALID_LIMIT_MAX: 100,
  INVALID_LIMIT_OVER_MAX: 150,
  INVALID_PAGE_ZERO: 0,
  INVALID_LIMIT_ZERO: 0,
};
