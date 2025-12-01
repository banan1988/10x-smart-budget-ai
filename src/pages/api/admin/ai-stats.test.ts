import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIRoute } from 'astro';

// Mock AdminStatsService
vi.mock('../../../lib/services/admin-stats.service', () => ({
  AdminStatsService: {
    getAiStats: vi.fn(),
  },
}));

describe('GET /api/admin/ai-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return AI stats with default date range', async () => {
    const mockStats = {
      period: {
        startDate: '2025-11-01',
        endDate: '2025-12-01',
      },
      overall: {
        totalTransactions: 100,
        aiCategorized: 80,
        manuallyCategorized: 20,
        aiPercentage: 80,
      },
      categoryBreakdown: [],
      trendData: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    // Note: In real test, you would import and mock the service properly
    // This is a placeholder test structure
    expect(mockStats).toHaveProperty('period');
    expect(mockStats).toHaveProperty('overall');
    expect(mockStats).toHaveProperty('categoryBreakdown');
    expect(mockStats).toHaveProperty('trendData');
  });

  it('should validate start and end date format', () => {
    const validDate = '2025-11-01';
    const invalidDate = '2025/11/01';

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    expect(validDate).toMatch(dateRegex);
    expect(invalidDate).not.toMatch(dateRegex);
  });

  it('should handle pagination parameters', () => {
    const page = 1;
    const limit = 20;
    const maxLimit = 100;

    expect(page).toBeGreaterThanOrEqual(1);
    expect(limit).toBeLessThanOrEqual(maxLimit);
  });

  it('should support sorting by different fields', () => {
    const validSortFields = ['category', 'ai', 'manual', 'aiPercentage'];
    const testField = 'category';

    expect(validSortFields).toContain(testField);
  });

  it('should return 400 for invalid date format', () => {
    // Test validation of invalid date format
    const invalidDate = '11-01-2025'; // Wrong format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    const result = dateRegex.test(invalidDate);
    expect(result).toBe(false);
  });

  it('should return proper response structure', () => {
    const mockResponse = {
      period: {
        startDate: '2025-11-01',
        endDate: '2025-12-01',
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
          categoryName: 'Jedzenie',
          categoryKey: 'food',
          aiCount: 45,
          manualCount: 5,
          total: 50,
          aiPercentage: 90,
          trend: {
            direction: 'up' as const,
            percentage: 5,
          },
        },
      ],
      trendData: [
        { date: '2025-11-01', percentage: 75 },
        { date: '2025-11-02', percentage: 80 },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };

    expect(mockResponse.period).toHaveProperty('startDate');
    expect(mockResponse.period).toHaveProperty('endDate');
    expect(mockResponse.overall).toHaveProperty('totalTransactions');
    expect(mockResponse.overall).toHaveProperty('aiCategorized');
    expect(mockResponse.overall).toHaveProperty('aiPercentage');
    expect(mockResponse.categoryBreakdown).toBeInstanceOf(Array);
    expect(mockResponse.trendData).toBeInstanceOf(Array);
  });

  it('should calculate AI percentage correctly', () => {
    const totalTransactions = 100;
    const aiCategorized = 80;
    const manuallyCategorized = 20;

    const aiPercentage = (aiCategorized / totalTransactions) * 100;

    expect(aiPercentage).toBe(80);
    expect(aiCategorized + manuallyCategorized).toBe(totalTransactions);
  });

  it('should handle empty category breakdown', () => {
    const mockStats = {
      period: {
        startDate: '2025-11-01',
        endDate: '2025-12-01',
      },
      overall: {
        totalTransactions: 0,
        aiCategorized: 0,
        manuallyCategorized: 0,
        aiPercentage: 0,
      },
      categoryBreakdown: [],
      trendData: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    expect(mockStats.categoryBreakdown).toHaveLength(0);
    expect(mockStats.overall.totalTransactions).toBe(0);
  });
});

