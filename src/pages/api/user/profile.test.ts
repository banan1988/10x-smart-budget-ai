import { describe, it, expect, vi } from 'vitest';
import { GET } from './profile';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';
import { DEFAULT_USER_ID } from '../../../db/constants';

describe('GET /api/user/profile', () => {
  const mockUserId = DEFAULT_USER_ID;

  it('should return 200 with user profile data', async () => {
    // Arrange
    const mockProfileData = {
      nickname: 'TestUser',
      preferences: { theme: 'dark', language: 'pl' },
    };

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
        user: { id: mockUserId },
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(mockProfileData);
    expect(data).toHaveProperty('nickname');
    expect(data).toHaveProperty('preferences');
  });

  it('should return correct UserProfileDto structure', async () => {
    // Arrange
    const mockProfileData = {
      nickname: 'User123',
      preferences: { theme: 'light' },
    };

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);
    const data = await response.json();

    // Assert
    expect(typeof data.nickname).toBe('string');
    expect(typeof data.preferences).toBe('object');
  });

  it('should return application/json content-type', async () => {
    // Arrange
    const mockProfileData = {
      nickname: 'TestUser',
      preferences: {},
    };

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should return 404 when profile does not exist', async () => {
    // Arrange
    const mockError = { code: 'PGRST116', message: 'Not found' };

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
          })),
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('message');
    expect(data.error).toBe('Not Found');
    expect(data.message).toBe('User profile does not exist');
  });

  it('should return 500 when database query fails', async () => {
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

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Internal Server Error');
  });

  it('should return 500 when service throws unexpected error', async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => {
        throw new Error('Unexpected error');
      }),
    } as any);

    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Internal Server Error');
    expect(data.message).toBe('Unexpected error');
  });

  it('should use hardcoded user ID when locals.user is not available', async () => {
    // Arrange
    const mockProfileData = {
      nickname: 'DefaultUser',
      preferences: {},
    };

    const eqMock = vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
    }));

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: eqMock,
        })),
      })),
    } as any);

    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
        user: undefined,
      },
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
    expect(eqMock).toHaveBeenCalledWith('user_id', mockUserId);
  });

  it('should call UserService.getUserProfile with correct parameters', async () => {
    // Arrange
    const customUserId = 'custom-user-id';
    const mockProfileData = {
      nickname: 'User',
      preferences: {},
    };

    const eqMock = vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: mockProfileData, error: null })),
    }));

    const selectMock = vi.fn(() => ({
      eq: eqMock,
    }));

    const fromMock = vi.fn(() => ({
      select: selectMock,
    }));

    const mockSupabase = createMockSupabaseClient({
      from: fromMock,
    } as any);

    const context = createMockAPIContext({
      locals: {
        supabase: mockSupabase,
        user: { id: customUserId },
      },
    });

    // Act
    await GET(context);

    // Assert
    expect(fromMock).toHaveBeenCalledWith('user_profiles');
    expect(selectMock).toHaveBeenCalledWith('nickname, preferences');
    expect(eqMock).toHaveBeenCalledWith('user_id', customUserId);
  });
});

