import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { APIContext } from 'astro';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Mock environment variables before importing the module
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');

describe('DELETE /api/user', () => {
  const mockUserId = DEFAULT_USER_ID;

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should return 500 when SUPABASE_SERVICE_ROLE_KEY is not configured', async () => {
    // Arrange - Mock missing service role key
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    // Re-import module with new env
    const { DELETE } = await import('./index');

    const context = {
      locals: {
        user: { id: mockUserId },
      },
    } as APIContext;

    // Act
    const response = await DELETE(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Internal Server Error');
    expect(data.message).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('should return application/json content-type on error', async () => {
    // Arrange
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    const { DELETE } = await import('./index');

    const context = {
      locals: {
        user: { id: mockUserId },
      },
    } as APIContext;

    // Act
    const response = await DELETE(context);

    // Assert
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  // Note: Integration tests that actually call Supabase APIs should be run
  // separately with proper test database setup. These tests verify error handling
  // and configuration validation without making real API calls.
});

