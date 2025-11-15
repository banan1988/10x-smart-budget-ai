import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { UserService } from '../../../lib/services/user.service';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * DELETE /api/user
 *
 * Permanently deletes the authenticated user's account and all associated data.
 * This operation is irreversible and will cascade delete all related data
 * (user_profiles, transactions, etc.).
 *
 * @returns 204 No Content on successful deletion
 * @returns 500 Internal Server Error if operation fails
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // TODO: Authentication - for now using hardcoded user ID
    const userId = locals.user?.id || DEFAULT_USER_ID;

    // Create admin Supabase client with service_role key
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete the user using admin client
    await UserService.deleteUser(supabaseAdmin, userId);

    // Return successful response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error deleting user:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

