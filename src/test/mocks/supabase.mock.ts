import { vi } from "vitest";
import type { SupabaseClient } from "../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../db/constants";

/**
 * Creates a mock Supabase client for testing purposes.
 * This mock implements the minimal interface needed for service and API tests.
 */
export function createMockSupabaseClient(overrides?: Partial<SupabaseClient>): SupabaseClient {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: {
            session: {
              user: {
                id: DEFAULT_USER_ID,
              },
            },
          },
        })
      ),
    },
    ...overrides,
  } as unknown as SupabaseClient;
}

/**
 * Factory function to create a mock Supabase query for simple SELECT operations.
 * Useful for reducing boilerplate in tests.
 *
 * @example
 * const mockSupabase = createMockSupabaseClient({
 *   from: vi.fn(() => createMockSelectQuery(mockData))
 * });
 */
export function createMockSelectQuery(data: any, error: any = null) {
  return {
    select: vi.fn(() => Promise.resolve({ data, error })),
    eq: vi.fn(() => ({
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data, error })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data, error })),
      })),
    })),
  };
}

/**
 * Factory function to create a mock Supabase client with a chained query for transactions.
 * Handles complex query chains like: from().select().eq().gte().lte().order().range()
 * Also supports: in(), ilike() for filters
 *
 * @example
 * const mockSupabase = createMockSupabaseClient({
 *   from: vi.fn(() => createMockTransactionQuery(mockData))
 * });
 */
export function createMockTransactionQuery(data: any, error: any = null) {
  const chainableMethods = {
    eq: vi.fn(() => chainableMethods),
    in: vi.fn(() => chainableMethods),
    ilike: vi.fn(() => chainableMethods),
    gte: vi.fn(() => chainableMethods),
    lte: vi.fn(() => chainableMethods),
    order: vi.fn(() => chainableMethods),
    range: vi.fn(() => Promise.resolve({ data, error, count: data?.length ?? 0 })),
  };

  return {
    select: vi.fn(() => chainableMethods),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data, error })),
      })),
    })),
  };
}

/**
 * Creates mock category data for testing.
 */
export function createMockCategoryData() {
  return [
    {
      id: 1,
      key: "groceries",
      translations: { pl: "Zakupy spożywcze", en: "Groceries" },
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: 2,
      key: "transport",
      translations: { pl: "Transport", en: "Transport" },
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: 3,
      key: "entertainment",
      translations: { pl: "Rozrywka", en: "Entertainment" },
      created_at: "2025-01-01T00:00:00Z",
    },
  ];
}
