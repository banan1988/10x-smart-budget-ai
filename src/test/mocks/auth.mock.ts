import { vi } from "vitest";
import type { APIContext } from "astro";

/**
 * Mock user profile data factory
 */
export function createMockUserProfile(overrides: Record<string, any> = {}) {
  return {
    id: "user-123",
    role: "user",
    nickname: "TestUser",
    ...overrides,
  };
}

/**
 * Creates a mock request with JSON body for auth endpoints
 */
export function createMockAuthRequest(
  body: any,
  url = "http://localhost:4321/api/auth",
  headers: Record<string, string> = {}
): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Creates a generic mock request - alias for createMockAuthRequest
 * Use for requests without specific endpoint
 */
export function createMockRequest(body: any, headers: Record<string, string> = {}): Request {
  return createMockAuthRequest(body, "http://localhost:4321/api/auth", headers);
}

/**
 * Creates a mock Astro API context for auth endpoints
 */
export function createMockAuthContext(request?: Request, cookies?: Record<string, any>): Partial<APIContext> {
  const defaultRequest = new Request("http://localhost:4321/api/auth", {
    method: "POST",
  });

  return {
    request: request || defaultRequest,
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      ...(cookies || {}),
    },
  };
}

/**
 * Creates a mock Supabase successful auth response
 */
export function mockSupabaseAuthSuccess(userId = "user-123", email = "test@example.com") {
  return {
    data: {
      user: { id: userId, email },
      session: { access_token: "token-123" },
    },
    error: null,
  };
}

/**
 * Creates a mock Supabase auth error response
 */
export function mockSupabaseAuthError(code: string, message: string, status = 400) {
  return {
    data: null,
    error: {
      code,
      message,
      status: code === "invalid_credentials" ? 401 : status,
    },
  };
}
