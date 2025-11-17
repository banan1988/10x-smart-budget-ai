import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from './transaction.service';
import { createMockSupabaseClient } from '../../test/mocks/supabase.mock';
import type { CreateTransactionCommand, UpdateTransactionCommand } from '../../types';

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

describe('TransactionService', () => {
  const userId = 'test-user-id';

  describe('getTransactions', () => {
    it('should return transactions for a specific month', async () => {
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

      // Act
      const result = await TransactionService.getTransactions(mockSupabase, userId, { month: '2025-11', page: 1, limit: 20 });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should transform database records to TransactionDto format', async () => {
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

      // Act
      const result = await TransactionService.getTransactions(mockSupabase, userId, { month: '2025-11', page: 1, limit: 20 });

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
      expect(result.data[0]).not.toHaveProperty('updated_at');
    });

    it('should include category with Polish translation', async () => {
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

      // Act
      const result = await TransactionService.getTransactions(mockSupabase, userId, { month: '2025-11', page: 1, limit: 20 });

      // Assert
      expect(result.data[0].category).toEqual({
        id: 1,
        key: 'groceries',
        name: 'Zakupy spożywcze',
      });
    });

    it('should handle transactions without category', async () => {
      // Arrange
      const mockData = [
        createMockTransactionData({
          category_id: null,
          categories: null,
        }),
      ];
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

      // Act
      const result = await TransactionService.getTransactions(mockSupabase, userId, { month: '2025-11', page: 1, limit: 20 });

      // Assert
      expect(result.data[0].category).toBeNull();
    });

    it('should return empty array when no data', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({ data: null, error: null, count: 0 })),
                  })),
                })),
              })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await TransactionService.getTransactions(mockSupabase, userId, { month: '2025-11', page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw error when database query fails', async () => {
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

      // Act & Assert
      await expect(
        TransactionService.getTransactions(mockSupabase, userId, { month: '2025-11', page: 1, limit: 20 })
      ).rejects.toThrow('Failed to fetch transactions: Database error');
    });
  });

  describe('createTransaction', () => {
    it('should create an income transaction', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'income',
        amount: 5000,
        description: 'Salary',
        date: '2025-11-01',
      };

      const mockData = createMockTransactionData({
        ...command,
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

      // Act
      const result = await TransactionService.createTransaction(mockSupabase, userId, command);

      // Assert
      expect(result.type).toBe('income');
      expect(result.amount).toBe(5000);
      expect(result.description).toBe('Salary');
      expect(result.category).toBeNull();
    });

    it('should create an expense transaction', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'expense',
        amount: 150,
        description: 'Grocery shopping',
        date: '2025-11-15',
      };

      const mockData = createMockTransactionData({
        ...command,
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

      // Act
      const result = await TransactionService.createTransaction(mockSupabase, userId, command);

      // Assert
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(150);
      expect(result.description).toBe('Grocery shopping');
    });

    it('should throw error when database insert fails', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
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

      // Act & Assert
      await expect(
        TransactionService.createTransaction(mockSupabase, userId, command)
      ).rejects.toThrow('Failed to create transaction: Insert failed');
    });

    it('should throw error when no data returned', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'expense',
        amount: 100,
        description: 'Test',
        date: '2025-11-15',
      };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      } as any);

      // Act & Assert
      await expect(
        TransactionService.createTransaction(mockSupabase, userId, command)
      ).rejects.toThrow('Failed to create transaction: No data returned');
    });
  });

  describe('updateTransaction', () => {
    const transactionId = 1;

    it('should update transaction amount', async () => {
      // Arrange
      const command: UpdateTransactionCommand = {
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

      // Act
      const result = await TransactionService.updateTransaction(
        mockSupabase,
        userId,
        transactionId,
        command
      );

      // Assert
      expect(result.amount).toBe(200);
    });

    it('should update multiple fields', async () => {
      // Arrange
      const command: UpdateTransactionCommand = {
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

      // Act
      const result = await TransactionService.updateTransaction(
        mockSupabase,
        userId,
        transactionId,
        command
      );

      // Assert
      expect(result.amount).toBe(300);
      expect(result.description).toBe('Updated description');
      expect(result.date).toBe('2025-11-20');
    });

    it('should throw error when transaction not found', async () => {
      // Arrange
      const command: UpdateTransactionCommand = {
        amount: 200,
      };

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

      // Act & Assert
      await expect(
        TransactionService.updateTransaction(mockSupabase, userId, transactionId, command)
      ).rejects.toThrow('Transaction not found or access denied');
    });

    it('should mark transaction as not AI categorized when manually setting category', async () => {
      // Arrange
      const command: UpdateTransactionCommand = {
        categoryId: 2,
      };

      const mockData = createMockTransactionData({
        category_id: 2,
        is_ai_categorized: false,
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
          update: vi.fn((updateData) => {
            // Verify that is_ai_categorized is set to false
            expect(updateData.is_ai_categorized).toBe(false);
            return {
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
                  })),
                })),
              })),
            };
          }),
        })),
      } as any);

      // Act
      const result = await TransactionService.updateTransaction(
        mockSupabase,
        userId,
        transactionId,
        command
      );

      // Assert
      expect(result.is_ai_categorized).toBe(false);
    });
  });

  describe('deleteTransaction', () => {
    const transactionId = 1;

    it('should delete transaction successfully', async () => {
      // Arrange
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

      // Act & Assert - should not throw
      await expect(
        TransactionService.deleteTransaction(mockSupabase, userId, transactionId)
      ).resolves.toBeUndefined();
    });

    it('should throw error when transaction not found', async () => {
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

      // Act & Assert
      await expect(
        TransactionService.deleteTransaction(mockSupabase, userId, transactionId)
      ).rejects.toThrow('Transaction not found or access denied');
    });

    it('should throw error when delete operation fails', async () => {
      // Arrange
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

      // Act & Assert
      await expect(
        TransactionService.deleteTransaction(mockSupabase, userId, transactionId)
      ).rejects.toThrow('Failed to delete transaction: Delete failed');
    });
  });
});

