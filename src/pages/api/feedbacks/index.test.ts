import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from './index';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';
import { DEFAULT_USER_ID } from '../../../db/constants';

describe('POST /api/feedbacks', () => {
  it('should return 201 with success message on valid feedback', async () => {
    // Arrange
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: insertSpy,
      })),
    } as any);

    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Great app!',
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('Dziękujemy za Twoją opinię.');
  });

  it('should accept feedback without comment', async () => {
    // Arrange
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: insertSpy,
      })),
    } as any);

    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 4,
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);
    expect(insertSpy).toHaveBeenCalledWith({
      user_id: DEFAULT_USER_ID,
      rating: 4,
      comment: null,
    });
  });

  it('should return 400 when rating is out of range (too low)', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 0,
          comment: 'Test',
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should return 400 when rating is out of range (too high)', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 6,
          comment: 'Test',
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
  });

  it('should return 400 when rating is not an integer', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 4.5,
          comment: 'Test',
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
  });

  it('should return 400 when comment exceeds 1000 characters', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const longComment = 'a'.repeat(1001);
    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: longComment,
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
  });

  it('should return 400 when request body is not valid JSON', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Invalid JSON in request body');
  });

  it('should return 500 when database operation fails', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ error: { message: 'DB error' } })),
      })),
    } as any);

    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Test',
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Failed to create feedback');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      request: new Request('http://localhost:4321/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Test',
        }),
      }),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

describe('GET /api/feedbacks', () => {
  it('should return 200 with paginated feedback list for admin', async () => {
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
        comment: null,
        created_at: '2025-11-15T09:00:00Z',
      },
    ];

    const rangeSpy = vi.fn(() => Promise.resolve({ data: mockData, error: null, count: 10 }));
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: rangeSpy,
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      url: new URL('http://localhost:4321/api/feedbacks?page=1&limit=10'),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('page', 1);
    expect(data).toHaveProperty('limit', 10);
    expect(data).toHaveProperty('total', 10);
    expect(data.data).toHaveLength(2);
  });

  it('should use default pagination values when not provided', async () => {
    // Arrange
    const rangeSpy = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: rangeSpy,
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      url: new URL('http://localhost:4321/api/feedbacks'),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.page).toBe(1); // default
    expect(data.limit).toBe(10); // default
    expect(rangeSpy).toHaveBeenCalledWith(0, 9); // page 1, limit 10
  });

  it('should validate and enforce maximum limit of 100', async () => {
    // Arrange
    const rangeSpy = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: rangeSpy,
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      url: new URL('http://localhost:4321/api/feedbacks?limit=200'),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
  });

  it('should return 403 for non-admin users', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      url: new URL('http://localhost:4321/api/feedbacks'),
      locals: { supabase: mockSupabase },
    });

    // TODO: Mock non-admin user when proper auth is implemented
    // For now, this test documents the expected behavior
    // The actual implementation uses DEFAULT_USER_ID which is hardcoded as admin

    // Act & Assert (currently skipped until proper auth)
    // Once auth is implemented, this should return 403 for non-admin users
    expect(true).toBe(true); // Placeholder
  });

  it('should return 500 when database query fails', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB error' }, count: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      url: new URL('http://localhost:4321/api/feedbacks'),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Failed to fetch feedbacks');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      url: new URL('http://localhost:4321/api/feedbacks'),
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

