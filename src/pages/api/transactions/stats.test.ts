import { describe, it, expect, vi } from 'vitest';
import { GET } from './stats';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

describe('GET /api/transactions/stats', () => {
  it('should return 200 with transaction stats for a valid month', async () => {
    // Arrange
    const mockTransactions = [
      { id: 1, type: 'income', amount: 500000, date: '2025-11-01', is_ai_categorized: false, category_id: null, user_id: 'test-user-id' },
      { id: 2, type: 'expense', amount: 200000, date: '2025-11-10', is_ai_categorized: false, category_id: 1, user_id: 'test-user-id' },
    ];

    const mockCategories = [
      { id: 1, key: 'groceries', translations: { pl: 'Zakupy spożywcze', en: 'Groceries' } },
    ];

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn((table) => {
        if (table === 'transactions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null })),
                })),
              })),
            })),
          };
        } else if (table === 'categories') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockCategories, error: null })),
            })),
          };
        }
        return {};
      }),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL('http://localhost/api/transactions/stats?month=2025-11'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('month', '2025-11');
    expect(data).toHaveProperty('totalIncome', 500000);
    expect(data).toHaveProperty('totalExpenses', 200000);
    expect(data).toHaveProperty('balance', 300000);
    expect(data).toHaveProperty('transactionCount', 2);
    expect(data.categoryBreakdown).toHaveLength(1);
  });

  it('should return 200 with AI summary when includeAiSummary is true', async () => {
    // Arrange
    const mockTransactions = [
      { id: 1, type: 'income', amount: 500000, date: '2025-11-01', is_ai_categorized: false, category_id: null, user_id: 'test-user-id' },
      { id: 2, type: 'expense', amount: 200000, date: '2025-11-10', is_ai_categorized: false, category_id: 1, user_id: 'test-user-id' },
    ];

    const mockCategories = [
      { id: 1, key: 'groceries', translations: { pl: 'Zakupy spożywcze', en: 'Groceries' } },
    ];

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn((table) => {
        if (table === 'transactions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null })),
                })),
              })),
            })),
          };
        } else if (table === 'categories') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockCategories, error: null })),
            })),
          };
        }
        return {};
      }),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL('http://localhost/api/transactions/stats?month=2025-11&includeAiSummary=true'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('aiSummary');
    expect(data.aiSummary).toContain('2025-11');
    expect(data.aiSummary).toContain('2 transakcji');
  });

  it('should return 400 when month parameter is missing', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({});

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL('http://localhost/api/transactions/stats'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
  });

  it('should return 400 when month parameter is invalid', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({});

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL('http://localhost/api/transactions/stats?month=invalid'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Validation failed');
  });

  it('should return 500 when database query fails', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn((table) => {
        if (table === 'transactions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL('http://localhost/api/transactions/stats?month=2025-11'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Failed to fetch transaction stats');
  });

  it('should handle empty transaction list', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn((table) => {
        if (table === 'transactions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL('http://localhost/api/transactions/stats?month=2025-11'),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('transactionCount', 0);
    expect(data).toHaveProperty('totalIncome', 0);
    expect(data).toHaveProperty('totalExpenses', 0);
    expect(data.categoryBreakdown).toHaveLength(0);
  });
});

