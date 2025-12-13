import { vi } from "vitest";
import type { APIContext } from "astro";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Creates a mock Astro API context for testing API endpoints.
 */
export function createMockAPIContext(overrides?: Partial<APIContext>): APIContext {
  return {
    request: new Request("http://localhost:4321/api/test"),
    params: {},
    props: {},
    url: new URL("http://localhost:4321/api/test"),
    redirect: vi.fn(),
    locals: {
      supabase: {} as SupabaseClient,
    },
    site: new URL("http://localhost:4321"),
    generator: "Astro v5.13.7",
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
    } as any,
    ...overrides,
  } as unknown as APIContext;
}
