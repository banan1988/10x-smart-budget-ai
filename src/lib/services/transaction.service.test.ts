import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import { createMockSupabaseClient } from '../../test/mocks/supabase.mock';
import type { CreateTransactionCommand, UpdateTransactionCommand } from '../../types';

// Mock AiCategorizationService to avoid OpenRouter API key requirement in tests
vi.mock('./ai-categorization.service', () => {
  return {
    AiCategorizationService: vi.fn(function() {
      this.categorizeTransaction = vi.fn().mockResolvedValue({
        categoryKey: 'other',
        confidence: 0,
        reasoning: 'Mocked result',
      });
    }),
  };
});

// Import after mocking
import { AiCategorizationService } from './ai-categorization.service';

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

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('should automatically categorize expense transaction using AI when no categoryId provided', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'expense',
        amount: 150,
        description: 'Coffee at Starbucks',
        date: '2025-11-15',
      };

      // Mock AI categorization result
      const mockCategorizationResult = {
        categoryKey: 'restaurants',
        confidence: 0.95,
        reasoning: 'Coffee purchase at a cafe establishment',
      };

      // Mock category from database
      const mockCategory = {
        id: 4,
        key: 'restaurants',
        name: 'Restauracje',
      };

      // Mock the transaction data with AI categorization
      const mockData = createMockTransactionData({
        ...command,
        category_id: 4,
        is_ai_categorized: true,
        categories: {
          id: 4,
          key: 'restaurants',
          translations: { pl: 'Restauracje', en: 'Restaurants' },
        },
      });

      // Configure the mock for this specific test
      const categorizeTransactionMock = vi.fn().mockResolvedValue(mockCategorizationResult);
      vi.mocked(AiCategorizationService).mockImplementationOnce(function() {
        this.categorizeTransaction = categorizeTransactionMock;
      } as any);

      // Mock category service
      const getCategoryByKeyMock = vi.fn().mockResolvedValue(mockCategory);
      vi.spyOn(CategoryService, 'getCategoryByKey').mockImplementation(getCategoryByKeyMock);

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
      expect(result.is_ai_categorized).toBe(true);
      expect(result.category).toEqual({
        id: 4,
        key: 'restaurants',
        name: 'Restauracje',
      });
      expect(categorizeTransactionMock).toHaveBeenCalledWith('Coffee at Starbucks');
      expect(getCategoryByKeyMock).toHaveBeenCalledWith(mockSupabase, 'restaurants');
    });

    it('should not use AI categorization for income transactions', async () => {
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
        is_ai_categorized: false,
        categories: null,
      });

      // Track AI service calls
      const categorizeTransactionMock = vi.fn();
      vi.mocked(AiCategorizationService).mockImplementationOnce(function() {
        this.categorizeTransaction = categorizeTransactionMock;
      } as any);

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
      expect(result.is_ai_categorized).toBe(false);
      expect(result.category).toBeNull();
      expect(categorizeTransactionMock).not.toHaveBeenCalled();
    });

    it('should not use AI categorization when manual categoryId is provided', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'expense',
        amount: 150,
        description: 'Coffee at Starbucks',
        date: '2025-11-15',
        categoryId: 4, // Manual category
      };

      const mockData = createMockTransactionData({
        ...command,
        category_id: 4,
        is_ai_categorized: false,
        categories: {
          id: 4,
          key: 'restaurants',
          translations: { pl: 'Restauracje', en: 'Restaurants' },
        },
      });

      // Track AI service calls
      const categorizeTransactionMock = vi.fn();
      vi.mocked(AiCategorizationService).mockImplementationOnce(function() {
        this.categorizeTransaction = categorizeTransactionMock;
      } as any);

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
      expect(result.is_ai_categorized).toBe(false);
      expect(result.category).toEqual({
        id: 4,
        key: 'restaurants',
        name: 'Restauracje',
      });
      expect(categorizeTransactionMock).not.toHaveBeenCalled();
    });

    it('should handle AI categorization failure gracefully and create transaction without category', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'expense',
        amount: 150,
        description: 'Coffee at Starbucks',
        date: '2025-11-15',
      };

      const mockData = createMockTransactionData({
        ...command,
        category_id: null,
        is_ai_categorized: false,
        categories: null,
      });

      // Mock AI categorization to throw error
      const categorizeTransactionMock = vi.fn().mockRejectedValue(
        new Error('AI service unavailable')
      );
      vi.mocked(AiCategorizationService).mockImplementationOnce(function() {
        this.categorizeTransaction = categorizeTransactionMock;
      } as any);

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
      expect(result.is_ai_categorized).toBe(false);
      expect(result.category).toBeNull();
    });

    it('should handle case when AI returns category key not found in database', async () => {
      // Arrange
      const command: CreateTransactionCommand = {
        type: 'expense',
        amount: 150,
        description: 'Unknown expense',
        date: '2025-11-15',
      };

      const mockData = createMockTransactionData({
        ...command,
        category_id: null,
        is_ai_categorized: false,
        categories: null,
      });

      // Mock AI categorization result with non-existent category
      const mockCategorizationResult = {
        categoryKey: 'non_existent_category',
        confidence: 0.8,
        reasoning: 'Some reasoning',
      };

      const categorizeTransactionMock = vi.fn().mockResolvedValue(mockCategorizationResult);
      vi.mocked(AiCategorizationService).mockImplementationOnce(function() {
        this.categorizeTransaction = categorizeTransactionMock;
      } as any);

      // Mock category service returning null (category not found)
      vi.spyOn(CategoryService, 'getCategoryByKey').mockResolvedValue(null);

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
      // Transaction should still be created successfully
      expect(result).toBeDefined();
      expect(result.type).toBe('expense');
      expect(result.amount).toBe(150);
      expect(result.description).toBe('Unknown expense');
      // Category should not be set since it wasn't found
      expect(result.is_ai_categorized).toBe(false);
      expect(result.category).toBeNull();
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

  describe('getStats', () => {
    const month = '2025-11';

    it('should return stats without AI summary by default', async () => {
      // Arrange
      const mockTransactions = [
        { id: 1, type: 'income', amount: 500000, date: '2025-11-01', is_ai_categorized: false, category_id: null, user_id: userId },
        { id: 2, type: 'expense', amount: 200000, date: '2025-11-10', is_ai_categorized: false, category_id: 1, user_id: userId },
        { id: 3, type: 'expense', amount: 100000, date: '2025-11-15', is_ai_categorized: true, category_id: 1, user_id: userId },
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

      // Act
      const result = await TransactionService.getStats(mockSupabase, userId, month);

      // Assert
      expect(result).toMatchObject({
        month,
        totalIncome: 500000,
        totalExpenses: 300000,
        balance: 200000,
        transactionCount: 3,
        aiCategorizedCount: 1,
        manualCategorizedCount: 1,
      });
      expect(result.aiSummary).toBeUndefined();
    });

    it('should return stats with AI summary when includeAiSummary is true', async () => {
      // Arrange
      const mockTransactions = [
        { id: 1, type: 'income', amount: 500000, date: '2025-11-01', is_ai_categorized: false, category_id: null, user_id: userId },
        { id: 2, type: 'expense', amount: 200000, date: '2025-11-10', is_ai_categorized: false, category_id: 1, user_id: userId },
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

      // Act
      const result = await TransactionService.getStats(mockSupabase, userId, month, true);

      // Assert
      expect(result.aiSummary).toBeDefined();
      expect(result.aiSummary).toContain('W 2025-11 odnotowano 2 transakcji');
      expect(result.aiSummary).toContain('pozytywne');
    });

    it('should generate appropriate AI summary for negative balance', async () => {
      // Arrange
      const mockTransactions = [
        { id: 1, type: 'income', amount: 100000, date: '2025-11-01', is_ai_categorized: false, category_id: null, user_id: userId },
        { id: 2, type: 'expense', amount: 300000, date: '2025-11-10', is_ai_categorized: false, category_id: 1, user_id: userId },
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

      // Act
      const result = await TransactionService.getStats(mockSupabase, userId, month, true);

      // Assert
      expect(result.aiSummary).toBeDefined();
      expect(result.aiSummary).toContain('Uwaga!');
      expect(result.aiSummary).toContain('przekroczyły');
    });

    it('should return empty stats when no transactions exist', async () => {
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

      // Act
      const result = await TransactionService.getStats(mockSupabase, userId, month);

      // Assert
      expect(result).toMatchObject({
        month,
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
        categoryBreakdown: [],
        aiCategorizedCount: 0,
        manualCategorizedCount: 0,
      });
    });
  });
});

