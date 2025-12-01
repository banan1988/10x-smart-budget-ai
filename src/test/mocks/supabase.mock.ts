import { vi } from 'vitest';
import type { SupabaseClient } from '../../db/supabase.client';
import { DEFAULT_USER_ID } from '../../db/constants';

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
    } as any,
    ...overrides,
  } as unknown as SupabaseClient;
}

/**
 * Creates mock category data for testing.
 */
export function createMockCategoryData() {
  return [
    {
      id: 1,
      key: 'groceries',
      translations: { pl: 'Zakupy spożywcze', en: 'Groceries' },
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      key: 'transport',
      translations: { pl: 'Transport', en: 'Transport' },
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 3,
      key: 'entertainment',
      translations: { pl: 'Rozrywka', en: 'Entertainment' },
      created_at: '2025-01-01T00:00:00Z',
    },
  ];
}

