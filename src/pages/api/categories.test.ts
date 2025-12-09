import { describe, it, expect, vi } from 'vitest';
import { GET } from './categories';
import { createMockAPIContext } from '../../test/mocks/astro.mock';
import { createMockSupabaseClient, createMockCategoryData } from '../../test/mocks/supabase.mock';

describe('GET /api/categories', () => {
  it('should return 200 with categories array', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
  });

  it('should return categories with correct DTO structure', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);
    const data = await response.json();

    // Assert
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('key');
    expect(data[0]).toHaveProperty('name');
    expect(typeof data[0].id).toBe('number');
    expect(typeof data[0].key).toBe('string');
    expect(typeof data[0].name).toBe('string');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should return categories sorted by Polish name', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);
    const data = await response.json();

    // Assert - Polish alphabetical order
    expect(data[0].name).toBe('Rozrywka');
    expect(data[1].name).toBe('Transport');
    expect(data[2].name).toBe('Zakupy spożywcze');
  });

  it('should return 500 when database query fails', async () => {
    // Arrange
    const mockError = { message: 'Database connection failed' };
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return 500 when service throws unexpected error', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => {
        throw new Error('Unexpected error');
      }),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
  });

  it('should return empty array when no categories exist', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it('should use Supabase client from context.locals', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const fromMock = vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
    }));
    const mockSupabase = createMockSupabaseClient({
      from: fromMock,
    } as any);

    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        supabase: mockSupabase,
      },
    });

    // Act
    await GET(context);

    // Assert - verify that the supabase client from locals was used
    expect(fromMock).toHaveBeenCalledWith('categories');
  });
});

