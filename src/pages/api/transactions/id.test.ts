import { describe, it, expect, vi, afterEach } from 'vitest';
import { PUT, DELETE } from './[id]';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

// Mock TransactionService at top level
vi.mock('../../../lib/services/transaction.service', () => ({
  TransactionService: {
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

function createMockRequest(body: any) {
  return new Request('http://localhost:4321/api/transactions/123', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PUT /api/transactions/[id]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 on successful update', async () => {
    const request = createMockRequest({
      type: 'expense',
      amount: 200,
      description: 'Updated transaction',
    });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockResolvedValue({
      id: 123,
      type: 'expense',
      amount: 200,
      description: 'Updated transaction',
    } as any);

    const response = await PUT(context as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id', 123);
  });

  it('should return 401 when not authenticated', async () => {
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: { supabase: createMockSupabaseClient() },
      params: { id: '123' },
      request,
    });

    const response = await PUT(context as any);

    expect(response.status).toBe(401);
  });

  it('should return 400 on invalid transaction ID', async () => {
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: 'invalid' },
      request,
    });

    const response = await PUT(context as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should return 400 on invalid JSON body', async () => {
    const request = new Request('http://localhost:4321/api/transactions/123', {
      method: 'PUT',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const response = await PUT(context as any);

    expect(response.status).toBe(400);
  });

  it('should return 404 when transaction not found', async () => {
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '999' },
      request,
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockRejectedValue(
      new Error('not found')
    );

    const response = await PUT(context as any);

    expect(response.status).toBe(404);
  });

  it('should validate amount is positive', async () => {
    const request = createMockRequest({
      amount: -100,
      description: 'Invalid amount',
    });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const response = await PUT(context as any);

    expect(response.status).toBe(400);
  });

  it('should accept partial updates', async () => {
    const request = createMockRequest({
      description: 'New description only',
    });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockResolvedValue({
      id: 123,
      type: 'expense',
      description: 'New description only',
    } as any);

    const response = await PUT(context as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.description).toBe('New description only');
  });

  it('should verify user owns transaction by returning 404 when not found', async () => {
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '999' },
      request,
    });

    // Service should verify ownership - returns 404 for unauthorized/not found
    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockRejectedValue(
      new Error('not found')
    );

    const response = await PUT(context as any);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should return 500 on service error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockRejectedValue(
      new Error('Database error')
    );

    const response = await PUT(context as any);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return Cache-Control headers', async () => {
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockResolvedValue({
      id: 123,
      type: 'expense',
      amount: 200,
    } as any);

    const response = await PUT(context as any);

    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('no-cache');
  });

  it('should return 500 on service error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const request = createMockRequest({ amount: 200 });

    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
      request,
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.updateTransaction).mockRejectedValue(new Error('Service error'));

    const response = await PUT(context as any);

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/transactions/[id]', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 204 on successful deletion', async () => {
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.deleteTransaction).mockResolvedValue(undefined);

    const response = await DELETE(context as any);

    expect(response.status).toBe(204);
  });

  it('should return 401 when not authenticated', async () => {
    const context = createMockAPIContext({
      locals: { supabase: createMockSupabaseClient() },
      params: { id: '123' },
    });

    const response = await DELETE(context as any);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 on invalid transaction ID', async () => {
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: 'invalid-id' },
    });

    const response = await DELETE(context as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should return 404 when transaction not found', async () => {
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '999' },
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.deleteTransaction).mockRejectedValue(
      new Error('not found')
    );

    const response = await DELETE(context as any);

    expect(response.status).toBe(404);
  });

  it('should return 500 on service error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '123' },
    });

    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.deleteTransaction).mockRejectedValue(
      new Error('Database error')
    );

    const response = await DELETE(context as any);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should verify user owns transaction before deletion', async () => {
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      params: { id: '999' },
    });

    // Service should verify ownership and throw 'not found' for unauthorized
    const { TransactionService } = await import('../../../lib/services/transaction.service');
    vi.mocked(TransactionService.deleteTransaction).mockRejectedValue(
      new Error('not found')
    );

    const response = await DELETE(context as any);

    expect(response.status).toBe(404);
    expect(TransactionService.deleteTransaction).toHaveBeenCalledWith(
      expect.anything(),
      'user-123',
      999
    );
  });
});

