import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST, GET } from './index';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

// Mock FeedbackService at top level
vi.mock('../../../lib/services/feedback.service', () => ({
  FeedbackService: {
    createFeedback: vi.fn(),
    getAllFeedback: vi.fn(),
  },
}));

// Mock api-auth with partial mocking using importOriginal
vi.mock('../../../lib/api-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/api-auth')>();
  return {
    ...actual,
    checkAuthentication: vi.fn(),
    checkAdminRole: vi.fn(),
  };
});

/**
 * Mock feedback data
 */
function mockFeedbackData(overrides = {}) {
  return {
    id: 'feedback-123',
    user_id: 'user-123',
    rating: 5,
    comment: 'Great app!',
    created_at: '2025-12-09T00:00:00Z',
    ...overrides,
  };
}

function createMockRequest(body: any) {
  return new Request('http://localhost:4321/api/feedbacks', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/feedbacks', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid feedback submission', () => {
    it('should return 201 on valid feedback with rating', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const { FeedbackService } = await import('../../../lib/services/feedback.service');
      vi.mocked(FeedbackService.createFeedback).mockResolvedValue(mockFeedbackData() as any);

      const request = createMockRequest({
        rating: 5,
        comment: 'Great app!',
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(201, 'Should return 201 Created status on valid feedback');
      const data = await response.json();
      expect(data, 'Response should contain rating property').toHaveProperty('rating');
      expect(data.rating, 'Rating should match input value').toBe(5);
    });

    it('should return 201 with feedback only (no comment)', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const { FeedbackService } = await import('../../../lib/services/feedback.service');
      vi.mocked(FeedbackService.createFeedback).mockResolvedValue(mockFeedbackData({ comment: undefined }) as any);

      const request = createMockRequest({
        rating: 4,
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(201, 'Should return 201 Created status without comment');
    });
  });

  describe('Rating validation', () => {
    it('should return 400 for rating 0 (out of range)', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const request = createMockRequest({
        rating: 0,
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400, 'Should return 400 for rating 0 (out of range)');
      const data = await response.json();
      expect(data, 'Response should contain error property').toHaveProperty('error');
    });

    it('should return 400 for rating 6 (out of range)', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const request = createMockRequest({
        rating: 6,
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400, 'Should return 400 for rating 6 (out of range)');
    });

    it('should return 400 for non-integer rating', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const request = createMockRequest({
        rating: 4.5,
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400, 'Should return 400 for non-integer rating');
    });

    it('should return 400 for missing rating', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const request = createMockRequest({
        comment: 'Good app',
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400, 'Should return 400 for missing rating');
      const data = await response.json();
      expect(data, 'Response should contain error property').toHaveProperty('error');
    });
  });

  describe('Comment validation', () => {
    it('should return 400 when comment exceeds 1000 chars', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const request = createMockRequest({
        rating: 5,
        comment: 'a'.repeat(1001),
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400, 'Should return 400 for comment exceeding 1000 characters');
      const data = await response.json();
      expect(data, 'Response should contain error property').toHaveProperty('error');
    });

    it('should accept comment with exactly 1000 chars', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const { FeedbackService } = await import('../../../lib/services/feedback.service');
      vi.mocked(FeedbackService.createFeedback).mockResolvedValue(mockFeedbackData() as any);

      const request = createMockRequest({
        rating: 5,
        comment: 'a'.repeat(1000),
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(201, 'Should accept comment with exactly 1000 characters');
    });
  });

  describe('Request validation', () => {
    it('should return 400 on invalid JSON', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const request = new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400, 'Should return 400 for invalid JSON');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([false, new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })] as any);

      const request = createMockRequest({
        rating: 5,
      });

      const context = createMockAPIContext({
        locals: {
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(401, 'Should return 401 when not authenticated');
      const data = await response.json();
      expect(data, 'Response should contain error property').toHaveProperty('error');
    });
  });

  describe('Content-Type', () => {
    it('should return application/json', async () => {
      // Arrange
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const { FeedbackService } = await import('../../../lib/services/feedback.service');
      vi.mocked(FeedbackService.createFeedback).mockResolvedValue(mockFeedbackData() as any);

      const request = createMockRequest({
        rating: 5,
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json', 'Response should have Content-Type: application/json');
    });
  });

  describe('Error handling', () => {
    it('should return 500 on service error', async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { checkAuthentication } = await import('../../../lib/api-auth');
      vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);

      const { FeedbackService } = await import('../../../lib/services/feedback.service');
      vi.mocked(FeedbackService.createFeedback).mockRejectedValue(new Error('Service error'));

      const request = createMockRequest({
        rating: 5,
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: createMockSupabaseClient(),
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500, 'Should return 500 on service error');
      expect(consoleErrorSpy).toHaveBeenCalled('Error should be logged to console');

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('GET /api/feedbacks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    // Arrange
    const { checkAuthentication } = await import('../../../lib/api-auth');
    vi.mocked(checkAuthentication).mockReturnValue([false, new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })] as any);

    const context = createMockAPIContext({
      locals: {
        supabase: createMockSupabaseClient(),
      },
      url: new URL('http://localhost:4321/api/feedbacks'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(401, 'Should return 401 when not authenticated');
  });

  it('should return 403 when not admin', async () => {
    // Arrange
    const { checkAuthentication, checkAdminRole } = await import('../../../lib/api-auth');
    vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);
    vi.mocked(checkAdminRole).mockResolvedValue([false, new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })] as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123', role: 'user' },
        supabase: createMockSupabaseClient(),
      },
      url: new URL('http://localhost:4321/api/feedbacks'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(403, 'Should return 403 when user is not admin');
  });

  it('should return 200 for admin users with pagination', async () => {
    // Arrange
    const { checkAuthentication, checkAdminRole } = await import('../../../lib/api-auth');
    vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);
    vi.mocked(checkAdminRole).mockResolvedValue([true] as any);

    const { FeedbackService } = await import('../../../lib/services/feedback.service');
    vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue({
      data: [mockFeedbackData()],
      page: 1,
      limit: 10,
      total: 1,
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'admin-123', role: 'admin' },
        supabase: createMockSupabaseClient(),
      },
      url: new URL('http://localhost:4321/api/feedbacks?page=1&limit=10'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(200, 'Should return 200 for admin users with pagination');
  });

  it('should validate pagination parameters', async () => {
    // Arrange
    const { checkAuthentication, checkAdminRole } = await import('../../../lib/api-auth');
    vi.mocked(checkAuthentication).mockReturnValue([true, undefined] as any);
    vi.mocked(checkAdminRole).mockResolvedValue([true] as any);

    const { FeedbackService } = await import('../../../lib/services/feedback.service');
    vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue({
      data: [],
      page: 1,
      limit: 10,
      total: 0,
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'admin-123', role: 'admin' },
        supabase: createMockSupabaseClient(),
      },
      url: new URL('http://localhost:4321/api/feedbacks?limit=200'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(400, 'Should return 400 for limit exceeding maximum (100)');
  });
});

