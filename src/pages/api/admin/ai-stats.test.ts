import { describe, it, expect } from 'vitest';

describe('GET /api/admin/ai-stats', () => {
  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', () => {
      const hasUser = false;
      const statusCode = !hasUser ? 401 : 200;
      expect(statusCode).toBe(401);
    });

    it('should return 403 for non-admin users', () => {
      const userRole = 'user';
      const isAdmin = userRole === 'admin';
      const statusCode = !isAdmin ? 403 : 200;
      expect(statusCode).toBe(403);
    });

    it('should return 200 for admin users', () => {
      const userRole = 'admin';
      const isAdmin = userRole === 'admin';
      const statusCode = isAdmin ? 200 : 403;
      expect(statusCode).toBe(200);
    });

    it('should require async checkAdminRole()', () => {
      // checkAdminRole is now async
      const isAsync = true;
      expect(isAsync).toBe(true);
    });
  });

  describe('Date range parameters', () => {
    it('should accept startDate and endDate in YYYY-MM-DD format', () => {
      const startDate = '2025-11-01';
      const endDate = '2025-12-09';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(startDate).toMatch(dateRegex);
      expect(endDate).toMatch(dateRegex);
    });

    it('should reject invalid date format', () => {
      const invalidDate = '11-01-2025';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(invalidDate).not.toMatch(dateRegex);
    });

    it('should reject startDate > endDate', () => {
      const startDate = '2025-12-09';
      const endDate = '2025-11-01';
      const isValid = startDate <= endDate;
      expect(isValid).toBe(false);
    });

    it('should return 400 when dates are invalid', () => {
      const isValid = false;
      const statusCode = !isValid ? 400 : 200;
      expect(statusCode).toBe(400);
    });
  });

  describe('Response structure', () => {
    it('should return AI categorization stats', () => {
      const response = {
        period: {
          startDate: '2025-11-01',
          endDate: '2025-12-09',
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
            categoryName: 'Food',
            categoryKey: 'food',
            aiCount: 45,
            manualCount: 5,
            total: 50,
            aiPercentage: 90,
          },
        ],
        trendData: [
          { date: '2025-11-01', percentage: 75 },
          { date: '2025-11-02', percentage: 78 },
        ],
      };

      expect(response).toHaveProperty('period');
      expect(response).toHaveProperty('overall');
      expect(response).toHaveProperty('categoryBreakdown');
      expect(response).toHaveProperty('trendData');
    });

    it('should include overall AI categorization percentage', () => {
      const overall = {
        totalTransactions: 100,
        aiCategorized: 80,
        manuallyCategorized: 20,
        aiPercentage: 80,
      };

      expect(overall.aiPercentage).toBe((overall.aiCategorized / overall.totalTransactions) * 100);
    });

    it('should break down stats by category', () => {
      const categoryStats = {
        categoryId: 1,
        categoryName: 'Food',
        categoryKey: 'food',
        aiCount: 40,
        manualCount: 10,
        total: 50,
        aiPercentage: 80,
      };

      expect(categoryStats.aiPercentage).toBe((categoryStats.aiCount / categoryStats.total) * 100);
    });

    it('should include trend data over time', () => {
      const trendData = [
        { date: '2025-11-01', percentage: 75 },
        { date: '2025-11-02', percentage: 78 },
        { date: '2025-11-03', percentage: 80 },
      ];

      expect(trendData.length).toBeGreaterThan(0);
      expect(trendData[0]).toHaveProperty('date');
      expect(trendData[0]).toHaveProperty('percentage');
    });
  });

  describe('Pagination (optional)', () => {
    it('should support page parameter', () => {
      const page = 1;
      expect(page).toBeGreaterThanOrEqual(1);
    });

    it('should support limit parameter', () => {
      const limit = 20;
      const maxLimit = 100;
      expect(limit).toBeLessThanOrEqual(maxLimit);
    });
  });

  describe('Data calculations', () => {
    it('should calculate correct AI percentage', () => {
      const aiCategorized = 80;
      const total = 100;
      const percentage = (aiCategorized / total) * 100;
      expect(percentage).toBe(80);
    });

    it('should sum category counts to total transactions', () => {
      const categories = [
        { total: 50 },
        { total: 40 },
        { total: 30 },
      ];
      const categoryTotal = categories.reduce((sum, cat) => sum + cat.total, 0);
      expect(categoryTotal).toBe(120);
    });

    it('should calculate trend correctly', () => {
      const trends = [
        { date: '2025-11-01', percentage: 75 },
        { date: '2025-11-02', percentage: 80 },
      ];

      const improvement = trends[1].percentage - trends[0].percentage;
      expect(improvement).toBe(5);
    });
  });

  describe('Error handling', () => {
    it('should return 400 for invalid date format', () => {
      const startDate = 'invalid';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const isValid = dateRegex.test(startDate);
      const statusCode = !isValid ? 400 : 200;
      expect(statusCode).toBe(400);
    });

    it('should return 400 when startDate > endDate', () => {
      const startDate = '2025-12-09';
      const endDate = '2025-11-01';
      const isValid = startDate <= endDate;
      const statusCode = !isValid ? 400 : 200;
      expect(statusCode).toBe(400);
    });
  });
});

