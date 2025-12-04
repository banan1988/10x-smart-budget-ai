import { describe, it, expect, vi } from 'vitest';
import { CategoryService } from './category.service';
import { createMockSupabaseClient, createMockCategoryData } from '../../test/mocks/supabase.mock';

describe('CategoryService', () => {
  describe('getGlobalCategories', () => {
    it('should return categories sorted by Polish name', async () => {
      // Arrange
      const mockData = createMockCategoryData();
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getGlobalCategories(mockSupabase);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Rozrywka'); // 'R' comes before 'T' and 'Z' in Polish
      expect(result[1].name).toBe('Transport');
      expect(result[2].name).toBe('Zakupy spożywcze');
    });

    it('should transform database records to CategoryDto format', async () => {
      // Arrange
      const mockData = createMockCategoryData();
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getGlobalCategories(mockSupabase);

      // Assert
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).not.toHaveProperty('translations');
      expect(result[0]).not.toHaveProperty('created_at');
    });

    it('should extract Polish translation from translations JSON', async () => {
      // Arrange
      const mockData = [
        {
          id: 1,
          key: 'test',
          translations: { pl: 'Polski tekst', en: 'English text' },
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getGlobalCategories(mockSupabase);

      // Assert
      expect(result[0].name).toBe('Polski tekst');
    });

    it('should fallback to key if Polish translation is missing', async () => {
      // Arrange
      const mockData = [
        {
          id: 1,
          key: 'fallback_key',
          translations: { en: 'English text' },
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getGlobalCategories(mockSupabase);

      // Assert
      expect(result[0].name).toBe('fallback_key');
    });

    it('should return empty array when data is null', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getGlobalCategories(mockSupabase);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const mockError = { message: 'Database connection failed' };
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
        })),
      } as any);

      // Act & Assert
      await expect(CategoryService.getGlobalCategories(mockSupabase)).rejects.toThrow(
        'Failed to fetch categories: Database connection failed'
      );
    });

    it('should call Supabase with correct query', async () => {
      // Arrange
      const mockData = createMockCategoryData();
      const selectMock = vi.fn(() => Promise.resolve({ data: mockData, error: null }));
      const fromMock = vi.fn(() => ({
        select: selectMock,
      }));
      const mockSupabase = createMockSupabaseClient({
        from: fromMock,
      } as any);

      // Act
      await CategoryService.getGlobalCategories(mockSupabase);

      // Assert
      expect(fromMock).toHaveBeenCalledWith('categories');
      expect(selectMock).toHaveBeenCalledWith('id, key, translations');
    });

    it('should sort Polish characters correctly (ą, ć, ę, ł, ń, ó, ś, ź, ż)', async () => {
      // Arrange
      const mockData = [
        { id: 1, key: 'zdrowie', translations: { pl: 'Zdrowie' }, created_at: '2025-01-01' },
        { id: 2, key: 'zabawa', translations: { pl: 'Żaba' }, created_at: '2025-01-01' },
        { id: 3, key: 'lody', translations: { pl: 'Łódź' }, created_at: '2025-01-01' },
        { id: 4, key: 'auto', translations: { pl: 'Ćma' }, created_at: '2025-01-01' },
      ];
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getGlobalCategories(mockSupabase);

      // Assert - Polish alphabetical order: Ć, Ł, Z, Ż
      expect(result.map((c) => c.name)).toEqual(['Ćma', 'Łódź', 'Zdrowie', 'Żaba']);
    });
  });

  describe('getCategoryByKey', () => {
    it('should return category by key', async () => {
      // Arrange
      const mockData = {
        id: 1,
        key: 'groceries',
        translations: { pl: 'Zakupy spożywcze', en: 'Groceries' },
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getCategoryByKey(mockSupabase, 'groceries');

      // Assert
      expect(result).toEqual({
        id: 1,
        key: 'groceries',
        name: 'Zakupy spożywcze',
      });
    });

    it('should return null when category is not found', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
              })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getCategoryByKey(mockSupabase, 'non_existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should extract Polish translation from translations JSON', async () => {
      // Arrange
      const mockData = {
        id: 2,
        key: 'transport',
        translations: { pl: 'Transport', en: 'Transport' },
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getCategoryByKey(mockSupabase, 'transport');

      // Assert
      expect(result?.name).toBe('Transport');
    });

    it('should fallback to key if Polish translation is missing', async () => {
      // Arrange
      const mockData = {
        id: 3,
        key: 'fallback_key',
        translations: { en: 'English text' },
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getCategoryByKey(mockSupabase, 'fallback_key');

      // Assert
      expect(result?.name).toBe('fallback_key');
    });

    it('should return null when data is null', async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getCategoryByKey(mockSupabase, 'test');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when database query fails with non-not-found error', async () => {
      // Arrange
      const mockError = { code: 'DB_ERROR', message: 'Database connection failed' };
      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
            })),
          })),
        })),
      } as any);

      // Act & Assert
      await expect(CategoryService.getCategoryByKey(mockSupabase, 'test')).rejects.toThrow(
        'Failed to fetch category: Database connection failed'
      );
    });

    it('should call Supabase with correct query parameters', async () => {
      // Arrange
      const mockData = {
        id: 1,
        key: 'groceries',
        translations: { pl: 'Zakupy spożywcze' },
        created_at: '2025-01-01T00:00:00Z',
      };

      const singleMock = vi.fn(() => Promise.resolve({ data: mockData, error: null }));
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      const fromMock = vi.fn(() => ({ select: selectMock }));

      const mockSupabase = createMockSupabaseClient({
        from: fromMock,
      } as any);

      // Act
      await CategoryService.getCategoryByKey(mockSupabase, 'groceries');

      // Assert
      expect(fromMock).toHaveBeenCalledWith('categories');
      expect(selectMock).toHaveBeenCalledWith('id, key, translations');
      expect(eqMock).toHaveBeenCalledWith('key', 'groceries');
      expect(singleMock).toHaveBeenCalled();
    });

    it('should transform database record to CategoryDto format', async () => {
      // Arrange
      const mockData = {
        id: 1,
        key: 'groceries',
        translations: { pl: 'Zakupy spożywcze' },
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockSupabase = createMockSupabaseClient({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
            })),
          })),
        })),
      } as any);

      // Act
      const result = await CategoryService.getCategoryByKey(mockSupabase, 'groceries');

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('translations');
      expect(result).not.toHaveProperty('created_at');
    });
  });
});

