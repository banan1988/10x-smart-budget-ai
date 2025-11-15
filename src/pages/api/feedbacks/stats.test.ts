import { describe, it, expect, vi } from 'vitest';
import { GET } from './stats';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

describe('GET /api/feedbacks/stats', () => {
  it('should return 200 with average rating and total count', async () => {
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

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('averageRating', 4.25);
    expect(data).toHaveProperty('totalFeedbacks', 4);
  });

  it('should return correct DTO structure', async () => {
    // Arrange
    const mockData = [{ rating: 5 }];
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);
    const data = await response.json();

    // Assert
    expect(data).toHaveProperty('averageRating');
    expect(data).toHaveProperty('totalFeedbacks');
    expect(typeof data.averageRating).toBe('number');
    expect(typeof data.totalFeedbacks).toBe('number');
    expect(Object.keys(data).length).toBe(2); // Only these two fields
  });

  it('should return zero stats when no feedback exists', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.averageRating).toBe(0);
    expect(data.totalFeedbacks).toBe(0);
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

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);
    const data = await response.json();

    // Assert
    expect(data.averageRating).toBe(4.67); // (5+5+4)/3 = 4.666... → 4.67
  });

  it('should return 500 when database query fails', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB connection failed' } })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Failed to fetch feedback statistics');
    expect(data).toHaveProperty('message');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const mockData = [{ rating: 5 }];
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

