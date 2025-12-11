import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './logout';
import { createMockAuthRequest, createMockAuthContext } from '../../../test/mocks/auth.mock';

// Mock Supabase client at top level
vi.mock('../../../db/supabase.client', () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe('POST /api/auth/logout', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful logout', () => {
    it('should return 200 on successful logout', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/auth/logout', { method: 'POST' });
      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import('../../../db/supabase.client');
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toMatchInlineSnapshot('"Wylogowano pomyślnie"');
    });
  });

  describe('Error handling', () => {
    it('should return 500 on Supabase error', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/auth/logout', { method: 'POST' });
      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import('../../../db/supabase.client');
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: new Error('Logout failed'),
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 500 on unexpected exception', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/auth/logout', { method: 'POST' });
      const context = createMockAuthContext(request);

      // Mock exception
      const { createSupabaseServerInstance } = await import('../../../db/supabase.client');
      vi.mocked(createSupabaseServerInstance).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Content-Type', () => {
    it('should return application/json content-type', async () => {
      // Arrange
      const request = new Request('http://localhost:4321/api/auth/logout', { method: 'POST' });
      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import('../../../db/supabase.client');
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});

