import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "./mocks/server";
import { createClient } from "@supabase/supabase-js";

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

/**
 * Global test constants
 */
export const TEST_API_KEY = "test-api-key-123";

/**
 * Global setup for OpenRouter tests
 * Prevents test pollution by stubbing fetch globally
 */
beforeEach(() => {
  // Stub fetch globally for tests that need it
  if (!global.fetch) {
    vi.stubGlobal("fetch", vi.fn());
  }
  // Set default test API key in environment
  import.meta.env.OPENROUTER_API_KEY = TEST_API_KEY;
});

afterEach(() => {
  // Restore globals after tests
  vi.unstubAllGlobals();
});

/**
 * Helper function to create a test user in Supabase
 */
export async function setupTestUser() {
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service key, obejdzie RLS
  );

  // Create test user
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.admin.createUser({
    email: process.env.E2E_USERNAME!,
    password: process.env.E2E_PASSWORD!,
    email_confirm: true,
  });

  return user;
}
