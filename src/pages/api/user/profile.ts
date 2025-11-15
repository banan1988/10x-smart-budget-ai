import type { APIRoute } from 'astro';
import { UserService } from '../../../lib/services/user.service';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * GET /api/user/profile
 *
 * Returns the profile data for the authenticated user.
 * Requires authentication via middleware.
 *
 * @returns 200 OK with UserProfileDto object
 * @returns 404 Not Found if user profile does not exist
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // TODO: Authentication - for now using hardcoded user ID
    const userId = locals.user?.id || DEFAULT_USER_ID;

    // Fetch user profile using the service
    const profile = await UserService.getUserProfile(supabase, userId);

    // Handle profile not found
    if (!profile) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'User profile does not exist',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return successful response with profile data
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching user profile:', error);

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

