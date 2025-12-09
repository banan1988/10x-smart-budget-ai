import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from '../db/database.types.ts';
import { DEFAULT_USER_ID } from './constants.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Cookie options for Supabase SSR integration
 * Secure, httpOnly, and sameSite are set for production security
 */
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24, // 24 hours
};

/**
 * Parse cookie header string into array of { name, value } objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

/**
 * Create Supabase server client for SSR with proper cookie management
 * This should be used in middleware and API routes, NOT in client-side code
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          context.cookies.set(name, value, options),
        );
      },
    },
  });
};

export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;

export { DEFAULT_USER_ID };
