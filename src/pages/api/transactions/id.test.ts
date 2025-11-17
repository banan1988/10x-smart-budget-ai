import { describe, it, expect, vi } from 'vitest';
import { PUT, DELETE } from './[id]';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

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

describe('PUT /api/transactions/[id]', () => {
  it('should return 200 with updated transaction', async () => {
    // Arrange
    const transactionId = 1;
    const requestBody = {
      amount: 200,
    };

    const mockData = createMockTransactionData({ amount: 200 });

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: transactionId }, error: null })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: String(transactionId) },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.amount).toBe(200);
  });

  it('should update multiple fields', async () => {
    // Arrange
    const transactionId = 1;
    const requestBody = {
      amount: 300,
      description: 'Updated description',
      date: '2025-11-20',
    };

    const mockData = createMockTransactionData({
      amount: 300,
      description: 'Updated description',
      date: '2025-11-20',
    });

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: transactionId }, error: null })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: String(transactionId) },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.amount).toBe(300);
    expect(data.description).toBe('Updated description');
    expect(data.date).toBe('2025-11-20');
  });

  it('should return 400 when transaction ID is invalid', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: 'invalid' },
      request: new Request('http://localhost:4321/api/transactions/invalid', {
        method: 'PUT',
        body: JSON.stringify({ amount: 100 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid transaction ID');
  });

  it('should return 400 when request body is invalid JSON', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: '1' },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid JSON');
  });

  it('should return 400 when no fields provided for update', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: '1' },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 400 when amount is invalid', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: '1' },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: -50 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('should return 404 when transaction not found', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: 'Not found' } })
              ),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: '999' },
      request: new Request('http://localhost:4321/api/transactions/999', {
        method: 'PUT',
        body: JSON.stringify({ amount: 100 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Not found');
  });

  it('should return 500 when database update fails', async () => {
    // Arrange
    const transactionId = 1;
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: transactionId }, error: null })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: 'Update failed' } })
                ),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: String(transactionId) },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: 100 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Failed to update transaction');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const transactionId = 1;
    const mockData = createMockTransactionData();
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: transactionId }, error: null })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
              })),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: String(transactionId) },
      request: new Request('http://localhost:4321/api/transactions/1', {
        method: 'PUT',
        body: JSON.stringify({ amount: 150 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    // Act
    const response = await PUT(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

describe('DELETE /api/transactions/[id]', () => {
  it('should return 204 when transaction deleted successfully', async () => {
    // Arrange
    const transactionId = 1;
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: transactionId }, error: null })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: String(transactionId) },
    });

    // Act
    const response = await DELETE(context);

    // Assert
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('should return 400 when transaction ID is invalid', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: 'invalid' },
    });

    // Act
    const response = await DELETE(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid transaction ID');
  });

  it('should return 404 when transaction not found', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: 'Not found' } })
              ),
            })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: '999' },
    });

    // Act
    const response = await DELETE(context);

    // Assert
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Not found');
  });

  it('should return 500 when database delete fails', async () => {
    // Arrange
    const transactionId = 1;
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: transactionId }, error: null })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ data: null, error: { message: 'Delete failed' } })
            ),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      params: { id: String(transactionId) },
    });

    // Act
    const response = await DELETE(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to delete transaction');
  });
});

