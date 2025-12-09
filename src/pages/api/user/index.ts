import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../db/database.types';
import { UserService } from '../../../lib/services/user.service';
import { checkAuthentication, createErrorResponse } from '../../../lib/api-auth';

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
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals } = context;
    const userId = locals.user!.id;

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
    return createErrorResponse(error, 500);
  }
};

