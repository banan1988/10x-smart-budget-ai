import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './stats';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

// Mock FeedbackService at top level
vi.mock('../../../lib/services/feedback.service', () => ({
  FeedbackService: {
    getFeedbackStats: vi.fn(),
  },
}));

describe('GET /api/feedbacks/stats', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with stats (public endpoint)', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
      },
      url: new URL('http://localhost:4321/api/feedbacks/stats'),
    });

    const { FeedbackService } = await import('../../../lib/services/feedback.service');
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({
      totalCount: 10,
      averageRating: 4.2,
      ratingDistribution: {
        1: 1,
        2: 0,
        3: 2,
        4: 3,
        5: 4,
      },
    } as any);

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(200, 'Should return 200 OK for public endpoint');
    const data = await response.json();
    expect(data, 'Response should contain totalCount').toHaveProperty('totalCount');
    expect(data, 'Response should contain averageRating').toHaveProperty('averageRating');
    expect(data, 'Response should contain ratingDistribution').toHaveProperty('ratingDistribution');
  });

  it('should return stats with correct structure', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
      },
      url: new URL('http://localhost:4321/api/feedbacks/stats'),
    });

    const { FeedbackService } = await import('../../../lib/services/feedback.service');
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue({
      totalCount: 10,
      averageRating: 4.2,
      ratingDistribution: { 1: 1, 2: 0, 3: 2, 4: 3, 5: 4 },
    } as any);

    // Act
    const response = await GET(context as any);
    const data = await response.json();

    // Assert
    expect(typeof data.totalCount).toBe('number', 'totalCount should be a number');
    expect(typeof data.averageRating).toBe('number', 'averageRating should be a number');
    expect(typeof data.ratingDistribution).toBe('object', 'ratingDistribution should be an object');
  });

  it('should return correct stats values', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
      },
      url: new URL('http://localhost:4321/api/feedbacks/stats'),
    });

    const mockStats = {
      totalCount: 42,
      averageRating: 3.8,
      ratingDistribution: { 1: 5, 2: 8, 3: 12, 4: 10, 5: 7 },
    };

    const { FeedbackService } = await import('../../../lib/services/feedback.service');
    vi.mocked(FeedbackService.getFeedbackStats).mockResolvedValue(mockStats as any);

    // Act
    const response = await GET(context as any);
    const data = await response.json();

    // Assert
    expect(data.totalCount).toBe(42, 'totalCount should match mock value');
    expect(data.averageRating).toBe(3.8, 'averageRating should match mock value');
    expect(data.ratingDistribution).toEqual(mockStats.ratingDistribution, 'ratingDistribution should match mock value');
  });

  it('should return 500 on service error', async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
      },
      url: new URL('http://localhost:4321/api/feedbacks/stats'),
    });

    const { FeedbackService } = await import('../../../lib/services/feedback.service');
    vi.mocked(FeedbackService.getFeedbackStats).mockRejectedValue(new Error('Database connection failed'));

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(500, 'Should return 500 on service error');
    expect(consoleErrorSpy, 'Error should be logged to console').toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return 500 when supabase client is not available', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        // supabase is missing
      },
      url: new URL('http://localhost:4321/api/feedbacks/stats'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(500, 'Should return 500 when supabase client is not available');
  });
});

