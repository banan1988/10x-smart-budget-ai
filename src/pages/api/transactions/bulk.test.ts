import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST, DELETE } from './bulk';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';

// Mock TransactionService at top level
vi.mock('../../../lib/services/transaction.service', () => ({
  TransactionService: {
    bulkCreateTransactions: vi.fn(),
    bulkDeleteTransactions: vi.fn(),
  },
}));

/**
 * Helper to create a mock request with JSON body
 */
function createMockRequest(body: any) {
  return new Request('http://localhost:4321/api/transactions/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}


/**
 * Helper to create transaction data
 */
function createTransaction(overrides = {}) {
  return {
    type: 'expense',
    amount: 100,
    description: 'Test transaction',
    date: '2025-11-15',
    ...overrides,
  };
}

describe('POST /api/transactions/bulk', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid bulk creation', () => {
    it('should return 201 with created transactions', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkCreateTransactions).mockResolvedValue([
        {
          id: 1,
          type: 'expense',
          amount: 100,
          description: 'Test transaction',
          date: '2025-11-15',
        },
      ]);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('created', 1);
      expect(data).toHaveProperty('transactions');
      expect(Array.isArray(data.transactions)).toBe(true);
    });

    it('should return 201 with 100 items', async () => {
      // Arrange
      const transactions = Array.from({ length: 100 }, (_, i) =>
        createTransaction({ id: i + 1 })
      );

      const request = createMockRequest({ transactions });
      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(201);
    });
  });

  describe('Bulk validation', () => {
    it('should return 400 when items exceed limit (101+)', async () => {
      // Arrange
      const transactions = Array.from({ length: 101 }, (_, i) =>
        createTransaction({ id: i + 1 })
      );

      const request = createMockRequest({ transactions });
      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 when array is empty', async () => {
      // Arrange
      const request = createMockRequest({ transactions: [] });
      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 when transactions property is missing', async () => {
      // Arrange
      const request = createMockRequest({});
      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Individual transaction validation', () => {
    it('should return 400 when transaction has invalid data', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [
          createTransaction({ amount: -100 }), // Invalid: negative amount
        ],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 when transaction has invalid type', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [
          createTransaction({ type: 'invalid' }),
        ],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 when transaction has invalid date format', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [
          createTransaction({ date: 'invalid-date' }),
        ],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('Request body validation', () => {
    it('should return 400 on invalid JSON', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Content-Type', () => {
    it('should return application/json content-type', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Cache headers', () => {
    it('should return no-cache headers for bulk operations', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await POST(context as any);

      // Assert
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
    });
  });

  describe('Error handling', () => {
    it('should return 500 on Supabase error', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service error
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkCreateTransactions).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 500 on unexpected exception', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service error
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkCreateTransactions).mockRejectedValue(
        new Error('Unexpected error')
      );

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 500 when service throws synchronously', async () => {
      // Arrange
      const request = createMockRequest({
        transactions: [createTransaction()],
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service to throw synchronously
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkCreateTransactions).mockImplementation(() => {
        throw new Error('Sync error');
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});

describe('DELETE /api/transactions/bulk', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid bulk deletion', () => {
    it('should return 200 with deleted count', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkDeleteTransactions).mockResolvedValue(3);

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('deleted', 3);
    });

    it('should accept 1-100 IDs', async () => {
      // Arrange
      const ids = Array.from({ length: 50 }, (_, i) => i + 1);
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Bulk deletion validation', () => {
    it('should return 400 when IDs exceed limit (101+)', async () => {
      // Arrange
      const ids = Array.from({ length: 101 }, (_, i) => i + 1);
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 when IDs array is empty', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 when IDs property is missing', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE authentication', () => {
    it('should return 401 when not authenticated', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('DELETE request body validation', () => {
    it('should return 400 on invalid JSON', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('DELETE Content-Type and Cache headers', () => {
    it('should return application/json content-type', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return no-cache headers for bulk deletion', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
    });
  });

  describe('DELETE error handling', () => {
    it('should return 500 on service error', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service error
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkDeleteTransactions).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 500 when service throws synchronously', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [1, 2, 3] }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = createMockAPIContext({
        locals: {
          user: { id: 'user-123' },
          supabase: {},
        },
        request,
      });

      // Mock service to throw synchronously
      const { TransactionService } = await import('../../../lib/services/transaction.service');
      vi.mocked(TransactionService.bulkDeleteTransactions).mockImplementation(() => {
        throw new Error('Sync error');
      });

      // Act
      const response = await DELETE(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});

