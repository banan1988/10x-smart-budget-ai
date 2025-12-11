import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './categories';
import { createMockAPIContext } from '../../test/mocks/astro.mock';
import { createMockSupabaseClient, createMockCategoryData, createMockSelectQuery } from '../../test/mocks/supabase.mock';

/**
 * Helper function to setup categories test context
 * Reduces boilerplate and improves maintainability
 */
function setupCategoriesTest(mockData = createMockCategoryData(), error = null) {
  const mockSupabase = createMockSupabaseClient({
    from: vi.fn(() => createMockSelectQuery(mockData, error)),
  });

  return createMockAPIContext({
    locals: {
      user: { id: 'test-user', email: 'test@example.com', role: 'user' },
      supabase: mockSupabase,
    },
  });
}

describe('GET /api/categories', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with categories array', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const context = setupCategoriesTest(mockData);

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
    const context = setupCategoriesTest(mockData);

    // Act
    const response = await GET(context);
    const data = await response.json();

    // Assert
    expect(data[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        key: expect.any(String),
        name: expect.any(String),
      })
    );
    expect(typeof data[0].id).toBe('number');
    expect(typeof data[0].key).toBe('string');
    expect(typeof data[0].name).toBe('string');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const context = setupCategoriesTest(mockData);

    // Act
    const response = await GET(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should return categories sorted by Polish name', async () => {
    // Arrange
    const mockData = createMockCategoryData();
    const context = setupCategoriesTest(mockData);

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
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const context = setupCategoriesTest(null, mockError);

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return 500 when service throws unexpected error', async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => {
        throw new Error('Unexpected error');
      }),
    });

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
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should return empty array when no categories exist', async () => {
    // Arrange
    const context = setupCategoriesTest([]);

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
    const fromMock = vi.fn(() => createMockSelectQuery(mockData));
    const mockSupabase = createMockSupabaseClient({
      from: fromMock,
    });

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

  it('should return 401 when user is not authenticated', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        supabase: createMockSupabaseClient(),
        // no user property
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 500 when supabase client is not available', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: 'test-user', email: 'test@example.com', role: 'user' },
        // no supabase client
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

