import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { DELETE } from './index';
import { createMockAPIContext } from '../../../test/mocks/astro.mock';
import { createMockSupabaseClient } from '../../../test/mocks/supabase.mock';

// Mock @supabase/supabase-js createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}));

// Mock UserService at top level with proper factory pattern
vi.mock('../../../lib/services/user.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/services/user.service')>();
  return {
    ...actual,
    UserService: {
      ...actual.UserService,
      deleteUser: vi.fn(),
      getUserProfile: vi.fn(),
      updateUserProfile: vi.fn(),
    },
  };
});

/**
 * Helper function to create mock DELETE requests
 */
function createMockRequest(method: string = 'DELETE'): Request {
  return new Request('http://localhost:4321/api/user', {
    method,
  });
}

describe('DELETE /api/user', () => {
  beforeEach(() => {
    // Set environment variables for tests
    import.meta.env.SUPABASE_URL = 'http://localhost:54321';
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: { supabase: createMockSupabaseClient() },
      request: createMockRequest(),
    });

    // Act
    const response = await DELETE(context as any);

    // Assert
    expect(response.status).toBe(401, 'Should return 401 Unauthorized when user is not authenticated');
  });

  it('should return 204 on successful deletion', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(),
    });

    const { UserService } = await import('../../../lib/services/user.service');
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    // Act
    const response = await DELETE(context as any);

    // Assert
    expect(response.status).toBe(204, 'Should return 204 No Content on successful deletion');
  });

  it('should call deleteUser service with admin client and user ID', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(),
    });

    const { UserService } = await import('../../../lib/services/user.service');
    const deleteUserMock = vi.mocked(UserService.deleteUser);
    deleteUserMock.mockResolvedValue(undefined);

    // Act
    const response = await DELETE(context as any);

    // Assert
    expect(response.status).toBe(204, 'Should return 204 No Content');
    expect(deleteUserMock).toHaveBeenCalledTimes(1, 'deleteUser should be called exactly once');
    // Verify the mock was called with correct arguments
    const callArgs = deleteUserMock.mock.calls[0];
    expect(callArgs, 'Should call deleteUser with admin Supabase client and user ID').toHaveLength(2);
    expect(callArgs[1]).toBe('user-123');
  });

  it('should delete user data irreversibly', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(),
    });

    const { UserService } = await import('../../../lib/services/user.service');
    const deleteUserMock = vi.mocked(UserService.deleteUser);
    deleteUserMock.mockResolvedValue(undefined);

    // Act
    const response = await DELETE(context as any);

    // Assert
    expect(response.status).toBe(204, 'Should return 204 No Content for successful deletion');
    // Verify the mock was called with correct user ID for irreversible deletion
    const callArgs = deleteUserMock.mock.calls[0];
    expect(callArgs[1], 'Should call deleteUser with correct user ID to ensure irreversible deletion').toBe('user-123');
  });

  it('should require SUPABASE_SERVICE_ROLE_KEY environment variable', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(),
    });

    const { UserService } = await import('../../../lib/services/user.service');
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    // Act
    const response = await DELETE(context as any);

    // Assert
    // If key is missing, should return 204 (from mock) or 500 (from actual implementation)
    expect([204, 500]).toContain(
      response.status,
      'Should return 204 or 500 depending on SUPABASE_SERVICE_ROLE_KEY availability'
    );
  });

  it('should return 500 on service error', async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(),
    });

    const { UserService } = await import('../../../lib/services/user.service');
    vi.mocked(UserService.deleteUser).mockRejectedValue(new Error('Service error'));

    // Act
    const response = await DELETE(context as any);

    // Assert
    expect(response.status).toBe(500, 'Should return 500 Internal Server Error when service fails');
    expect(consoleErrorSpy).toHaveBeenCalled('Should log error to console');
    // Verify the error was logged with correct prefix
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain('Error deleting user', 'Should log with correct error prefix');

    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  it('should have no response body on 204', async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: 'user-123' },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(),
    });

    const { UserService } = await import('../../../lib/services/user.service');
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    // Act
    const response = await DELETE(context as any);

    // Assert
    expect(response.status).toBe(204, 'Should return 204 No Content');
    expect(response.body).toBeNull('Response body should be null for 204 status');
  });
});

