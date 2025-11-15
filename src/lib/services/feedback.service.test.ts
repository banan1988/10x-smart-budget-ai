import { describe, it, expect, vi } from 'vitest';
import { FeedbackService } from './feedback.service';
import { createMockSupabaseClient } from '../../test/mocks/supabase.mock';

describe('FeedbackService', () => {
  describe('createFeedback', () => {
    it('should create feedback successfully', async () => {
      // Arrange
      const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
      const fromSpy = vi.fn(() => ({
        insert: insertSpy,
      }));
      const mockSupabase = createMockSupabaseClient({
        from: fromSpy,
      } as any);

      const userId = 'test-user-id';
      const feedbackData = {
        rating: 5,
        comment: 'Great app!',
      };

      // Act
      await FeedbackService.createFeedback(mockSupabase, userId, feedbackData);

      // Assert
      expect(fromSpy).toHaveBeenCalledWith('feedback');
      expect(insertSpy).toHaveBeenCalledWith({
        user_id: userId,
        rating: 5,
        comment: 'Great app!',
      });
    });

    it('should create feedback with null comment when comment is undefined', async () => {
      // Arrange
      const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
      const fromSpy = vi.fn(() => ({
        insert: insertSpy,
      }));
      const mockSupabase = createMockSupabaseClient({
        from: fromSpy,
      } as any);

      const userId = 'test-user-id';
      const feedbackData = {
        rating: 4,
      };

      // Act
      await FeedbackService.createFeedback(mockSupabase, userId, feedbackData);

      // Assert
      expect(insertSpy).toHaveBeenCalledWith({
        user_id: userId,
        rating: 4,
        comment: null,
      });
    });

    it('should throw error when database insertion fails', async () => {
      // Arrange
      const mockError = { message: 'Database error' };
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          insert: vi.fn(() => Promise.resolve({ error: mockError })),
        })),
      } as any);

      const userId = 'test-user-id';
      const feedbackData = { rating: 5, comment: 'Test' };

      // Act & Assert
      await expect(
        FeedbackService.createFeedback(mockSupabase, userId, feedbackData)
      ).rejects.toThrow('Failed to create feedback: Database error');
    });
  });

  describe('getFeedbackStats', () => {
    it('should calculate average rating and total count correctly', async () => {
      // Arrange
      const mockData = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
      ];
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await FeedbackService.getFeedbackStats(mockSupabase);

      // Assert
      expect(result.averageRating).toBe(4.25); // (5+4+5+3)/4 = 4.25
      expect(result.totalFeedbacks).toBe(4);
    });

    it('should round average rating to 2 decimal places', async () => {
      // Arrange
      const mockData = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
      ];
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await FeedbackService.getFeedbackStats(mockSupabase);

      // Assert
      expect(result.averageRating).toBe(4.67); // (5+5+4)/3 = 4.666... → 4.67
    });

    it('should return zero stats when no feedback exists', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      } as any);

      // Act
      const result = await FeedbackService.getFeedbackStats(mockSupabase);

      // Assert
      expect(result.averageRating).toBe(0);
      expect(result.totalFeedbacks).toBe(0);
    });

    it('should return zero stats when data is null', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      } as any);

      // Act
      const result = await FeedbackService.getFeedbackStats(mockSupabase);

      // Assert
      expect(result.averageRating).toBe(0);
      expect(result.totalFeedbacks).toBe(0);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const mockError = { message: 'Database connection failed' };
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
        })),
      } as any);

      // Act & Assert
      await expect(
        FeedbackService.getFeedbackStats(mockSupabase)
      ).rejects.toThrow('Failed to fetch feedback stats: Database connection failed');
    });
  });

  describe('getAllFeedback', () => {
    it('should return paginated feedback list', async () => {
      // Arrange
      const mockData = [
        {
          id: 1,
          user_id: 'user-1',
          rating: 5,
          comment: 'Great!',
          created_at: '2025-11-15T10:00:00Z',
        },
        {
          id: 2,
          user_id: 'user-2',
          rating: 4,
          comment: 'Good',
          created_at: '2025-11-15T09:00:00Z',
        },
      ];
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: mockData, error: null, count: 10 })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await FeedbackService.getAllFeedback(mockSupabase, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.data).toEqual(mockData);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(10);
    });

    it('should calculate correct range for pagination', async () => {
      // Arrange
      const rangeSpy = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const orderSpy = vi.fn(() => ({
        range: rangeSpy,
      }));
      const selectSpy = vi.fn(() => ({
        order: orderSpy,
      }));
      const fromSpy = vi.fn(() => ({
        select: selectSpy,
      }));
      const mockSupabase = createMockSupabaseClient({
        from: fromSpy,
      } as any);

      // Act
      await FeedbackService.getAllFeedback(mockSupabase, {
        page: 3,
        limit: 20,
      });

      // Assert
      expect(rangeSpy).toHaveBeenCalledWith(40, 59); // page 3, limit 20: from = (3-1)*20 = 40, to = 40+20-1 = 59
    });

    it('should order by created_at descending (newest first)', async () => {
      // Arrange
      const rangeSpy = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const orderSpy = vi.fn(() => ({
        range: rangeSpy,
      }));
      const selectSpy = vi.fn(() => ({
        order: orderSpy,
      }));
      const fromSpy = vi.fn(() => ({
        select: selectSpy,
      }));
      const mockSupabase = createMockSupabaseClient({
        from: fromSpy,
      } as any);

      // Act
      await FeedbackService.getAllFeedback(mockSupabase, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no feedback exists', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: null, error: null, count: 0 })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await FeedbackService.getAllFeedback(mockSupabase, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const mockError = { message: 'Query timeout' };
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: null, error: mockError, count: null })),
            })),
          })),
        })),
      } as any);

      // Act & Assert
      await expect(
        FeedbackService.getAllFeedback(mockSupabase, { page: 1, limit: 10 })
      ).rejects.toThrow('Failed to fetch feedback: Query timeout');
    });
  });
});

