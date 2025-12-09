import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from './transactions';
import { createMockAPIContext } from '../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../test/mocks/supabase.mock';

// Mock BackgroundCategorizationService to prevent background jobs in tests
vi.mock('../../lib/services/background-categorization.service', () => {
  return {
    BackgroundCategorizationService: vi.fn(function() {
      this.categorizeTransactionInBackground = vi.fn().mockResolvedValue(undefined);
    }),
  };
});

/**
 * Helper function to create mock transaction data
 */
function createMockTransactionData(overrides = {}) {
  return {
    id: 1,
    type: 'expense',
    amount: 100,
    description: 'Test transaction',
    date: '2025-11-15',
    is_ai_categorized: false,
    categorization_status: 'completed',
    category_id: 1,
    user_id: 'test-user-id',
    created_at: '2025-11-15T10:00:00Z',
    updated_at: '2025-11-15T10:00:00Z',
    categories: {
      id: 1,
      key: 'groceries',
      translations: { pl: 'Zakupy spożywcze', en: 'Groceries' },
    },
    ...overrides,
  };
}

describe('GET /api/transactions', () => {
  it('should return 200 with transactions array for valid month', async () => {
    // Arrange
    const mockData = [
      createMockTransactionData({ id: 1, date: '2025-11-15' }),
      createMockTransactionData({ id: 2, date: '2025-11-10' }),
    ];

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({ data: mockData, error: null, count: 2 })),
                })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      url: new URL('http://localhost:4321/api/transactions?month=2025-11'),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
  });

  it('should return transactions with correct DTO structure', async () => {
    // Arrange
    const mockData = [createMockTransactionData()];
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({ data: mockData, error: null, count: 1 })),
                })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      url: new URL('http://localhost:4321/api/transactions?month=2025-11'),
    });

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('type');
    expect(result.data[0]).toHaveProperty('amount');
    expect(result.data[0]).toHaveProperty('description');
    expect(result.data[0]).toHaveProperty('date');
    expect(result.data[0]).toHaveProperty('is_ai_categorized');
    expect(result.data[0]).toHaveProperty('category');
    expect(result.data[0]).not.toHaveProperty('user_id');
    expect(result.data[0]).not.toHaveProperty('created_at');
  });

  it('should return 400 when month parameter is missing', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      url: new URL('http://localhost:4321/api/transactions'),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Validation failed');
  });

  it('should return 400 when month parameter has invalid format', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      url: new URL('http://localhost:4321/api/transactions?month=2025-13'),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Validation failed');
  });

  it('should return 500 when database query fails', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() =>
                    Promise.resolve({ data: null, error: { message: 'Database error' }, count: null })
                  ),
                })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      url: new URL('http://localhost:4321/api/transactions?month=2025-11'),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to fetch transactions');
  });

  it('should return empty array when no transactions exist', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
                })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      url: new URL('http://localhost:4321/api/transactions?month=2025-11'),
    });

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});

describe('POST /api/transactions', () => {
  it('should return 201 with created transaction for valid income', async () => {
    // Arrange
    const requestBody = {
      type: 'income',
      amount: 5000,
      description: 'Salary',
      date: '2025-11-01',
    };

    const mockData = createMockTransactionData({
      ...requestBody,
      category_id: null,
      categories: null,
    });

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe('income');
    expect(data.amount).toBe(5000);
    expect(data.description).toBe('Salary');
  });

  it('should return 201 with created transaction for valid expense', async () => {
    // Arrange
    const requestBody = {
      type: 'expense',
      amount: 150,
      description: 'Grocery shopping',
      date: '2025-11-15',
    };

    const mockData = createMockTransactionData(requestBody);

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe('expense');
    expect(data.amount).toBe(150);
  });

  it('should return 400 when request body is invalid JSON', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid JSON');
  });

  it('should return 400 when required fields are missing', async () => {
    // Arrange
    const requestBody = {
      type: 'expense',
      // missing amount, description, date
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Validation failed');
    expect(data).toHaveProperty('details');
  });

  it('should return 400 when amount is not positive', async () => {
    // Arrange
    const requestBody = {
      type: 'expense',
      amount: -50,
      description: 'Test',
      date: '2025-11-15',
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 400 when date format is invalid', async () => {
    // Arrange
    const requestBody = {
      type: 'expense',
      amount: 100,
      description: 'Test',
      date: '15-11-2025', // Invalid format
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 400 when type is not income or expense', async () => {
    // Arrange
    const requestBody = {
      type: 'invalid',
      amount: 100,
      description: 'Test',
      date: '2025-11-15',
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 500 when database insert fails', async () => {
    // Arrange
    const requestBody = {
      type: 'expense',
      amount: 100,
      description: 'Test',
      date: '2025-11-15',
    };

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { message: 'Insert failed' } })
            ),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to create transaction');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const requestBody = {
      type: 'income',
      amount: 1000,
      description: 'Test',
      date: '2025-11-15',
    };

    const mockData = createMockTransactionData(requestBody);
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { user: { id: 'test-user-id', email: 'test.com', role: 'user' }, supabase: mockSupabase },
      request: new Request('http://localhost:4321/api/transactions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

