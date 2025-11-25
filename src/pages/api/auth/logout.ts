import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user by clearing the session
 */
export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
  try {
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return new Response(JSON.stringify({ error: 'Failed to logout' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clear session cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

