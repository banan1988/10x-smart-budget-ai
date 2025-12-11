import { describe, it, expect, vi, expectTypeOf, beforeEach } from 'vitest';
import { FeedbackService } from './feedback.service';
import { createMockSupabaseClient } from '../../test/mocks/supabase.mock';
import type { FeedbackDto } from '../../types';

/**
 * Tests for FeedbackService
 *
 * This service manages user feedback creation and retrieval.
 * Critical for: Admin dashboard feedback review, user engagement tracking
 *
 * @group Services
 * @group Database
 */
describe('FeedbackService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient({});
  });

  /**
   * Tests for createFeedback method
   *
   * Creates new feedback record in database and returns the created entity.
   * This is critical for collecting user feedback which drives product improvements.
   */
  describe('createFeedback', () => {
    it('should create feedback and return FeedbackDto with all fields', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockFeedbackData = {
        rating: 5,
        comment: 'Great application, very intuitive!',
      };

      const feedbackResponse = {
        id: 1,
        user_id: mockUserId,
        rating: 5,
        comment: 'Great application, very intuitive!',
        created_at: '2025-12-11T10:30:00Z',
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: feedbackResponse, error: null })
            ),
          })),
        })),
      }));

      // Act
      const result = await FeedbackService.createFeedback(
        mockSupabase,
        mockUserId,
        mockFeedbackData
      );

      // Assert - Value
      expect(result).toMatchInlineSnapshot(`
        {
          "comment": "Great application, very intuitive!",
          "created_at": "2025-12-11T10:30:00Z",
          "id": 1,
          "rating": 5,
          "user_id": "user-123",
        }
      `);

      // Assert - Type
      expectTypeOf(result).toMatchTypeOf<FeedbackDto>();
      expectTypeOf(result.id).toMatchTypeOf<number>();
      expectTypeOf(result.user_id).toMatchTypeOf<string>();
      expectTypeOf(result.rating).toMatchTypeOf<number>();
      expectTypeOf(result.created_at).toMatchTypeOf<string>();

      // Assert - Database calls
      expect(mockSupabase.from).toHaveBeenCalledWith('feedback');
    });

    it('should create feedback with minimal fields', async () => {
      // Arrange
      const mockUserId = 'user-456';
      const mockFeedbackData = {
        rating: 3,
        comment: '', // Empty comment allowed
      };

      const feedbackResponse = {
        id: 2,
        user_id: mockUserId,
        rating: 3,
        comment: '',
        created_at: '2025-12-11T11:00:00Z',
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: feedbackResponse, error: null })
            ),
          })),
        })),
      }));

      // Act
      const result = await FeedbackService.createFeedback(
        mockSupabase,
        mockUserId,
        mockFeedbackData
      );

      // Assert
      expect(result.id).toBe(2);
      expect(result.rating).toBe(3);
      expect(result.comment).toBe('');
    });

    it('should throw error when database fails during insert', async () => {
      // Arrange
      const mockUserId = 'user-123';
      const mockFeedbackData = { rating: 5, comment: 'test' };
      const mockError = {
        code: 'ERR_INSERT',
        message: 'Database constraint violation',
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: mockError })
            ),
          })),
        })),
      }));

      // Act & Assert
      await expect(
        FeedbackService.createFeedback(mockSupabase, mockUserId, mockFeedbackData)
      ).rejects.toThrow('Failed to create feedback: Database constraint violation');
    });

    it('should throw error when no data returned despite no error', async () => {
      // Arrange - Edge case: database silently returns nothing
      const mockUserId = 'user-123';
      const mockFeedbackData = { rating: 5, comment: 'test' };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
      }));

      // Act & Assert
      await expect(
        FeedbackService.createFeedback(mockSupabase, mockUserId, mockFeedbackData)
      ).rejects.toThrow('Failed to create feedback: No data returned');
    });

    it('should pass correct insert data to database', async () => {
      // Arrange
      const mockUserId = 'user-789';
      const mockFeedbackData = {
        rating: 4,
        comment: 'Good app',
      };

      const insertMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 3, user_id: mockUserId, ...mockFeedbackData, created_at: '2025-12-11' },
              error: null,
            })
          ),
        })),
      }));

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
      }));

      // Act
      await FeedbackService.createFeedback(mockSupabase, mockUserId, mockFeedbackData);

      // Assert - Verify insert was called with correct data
      expect(insertMock).toHaveBeenCalledWith({
        user_id: mockUserId,
        rating: mockFeedbackData.rating,
        comment: mockFeedbackData.comment,
      });
    });
  });
});

