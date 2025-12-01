import type { APIRoute } from 'astro';
import { z } from 'zod';
import { UserService } from '../../../lib/services/user.service';
import { DEFAULT_USER_ID } from '../../../db/constants';
import type { UpdateProfileRequest, UpdateProfileResponse } from '../../../types';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * Zod schema for validating PUT /api/user/profile request body
 */
const UpdateProfileSchema = z.object({
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(50, 'Nickname must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Nickname can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
});

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

/**
 * PUT /api/user/profile
 *
 * Updates the profile data for the authenticated user.
 * Requires authentication via middleware.
 *
 * @returns 200 OK with UpdateProfileResponse object
 * @returns 400 Bad Request if validation fails
 * @returns 404 Not Found if user profile does not exist
 * @returns 500 Internal Server Error if operation fails
 */
export const PUT: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // TODO: Authentication - for now using hardcoded user ID
    const userId = locals.user?.id || DEFAULT_USER_ID;

    // Parse request body
    let body: UpdateProfileRequest;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate request body
    const validationResult = UpdateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Validation failed',
          errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Update user profile using the service
    const updatedProfile = await UserService.updateUserProfile(supabase, userId, {
      nickname: validationResult.data.nickname.trim(),
    });

    // Return successful response
    const response: UpdateProfileResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        nickname: updatedProfile.nickname || '',
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error updating user profile:', error);

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
