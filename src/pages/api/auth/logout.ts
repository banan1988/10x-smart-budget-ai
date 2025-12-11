import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

/**
 * Error response helper
 */
function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any = {}, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * POST /api/auth/logout
 * Logs out the current user and clears session cookies
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Sign out from Supabase (clears cookies automatically)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Logout Error]', error);
      return errorResponse('Nie udało się wylogować', 500);
    }

    // Return success
    return successResponse({ message: 'Wylogowano pomyślnie' });
  } catch (err) {
    console.error('[Logout Exception]', err);
    return errorResponse('Wewnętrzny błąd serwera', 500);
  }
};

