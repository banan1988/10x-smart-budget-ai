import type { APIRoute } from "astro";
import { z } from "zod";
import { UserService } from "../../../lib/services/user.service";
import type { UpdateProfileRequest, UpdateProfileResponse } from "../../../types";
import {
  checkAuthentication,
  createValidationErrorResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../../../lib/api-auth";

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * Zod schema for validating PUT /api/user/profile request body
 */
const UpdateProfileSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(50, "Nickname must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Nickname can only contain letters, numbers, spaces, hyphens, and underscores"),
});

/**
 * GET /api/user/profile
 *
 * Returns the profile data for the authenticated user.
 * Requires authentication via middleware.
 *
 * @returns 200 OK with UserProfileDto object
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if user profile does not exist
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals } = context;
    const user = locals.user!;

    // Return user profile from locals
    // Profile was already fetched in middleware for page requests
    // For API-only requests, we have role='user' and nickname=undefined by default
    const profile = {
      id: user.id,
      email: user.email,
      role: user.role,
      nickname: user.nickname,
      createdAt: user.createdAt, // User registration date
    };

    // Return successful response with profile data
    const response = createSuccessResponse(profile, 200);

    // Cache the profile for the entire session (1 hour)
    // AppHeader fetches this once on app startup and caches in sessionStorage
    response.headers.set("Cache-Control", "private, max-age=3600");

    return response;
  } catch (error) {
    // Log error for debugging
    console.error("Error fetching user profile:", error);
    return createErrorResponse(error, 500);
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
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if user profile does not exist
 * @returns 500 Internal Server Error if operation fails
 */
export const PUT: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals, request } = context;
    const supabase = locals.supabase!;
    const userId = locals.user!.id;

    // Parse request body
    let body: UpdateProfileRequest;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate request body
    const validationResult = UpdateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return createValidationErrorResponse(errors);
    }

    // Update user profile using the service
    const updatedProfile = await UserService.updateUserProfile(supabase, userId, {
      nickname: validationResult.data.nickname.trim(),
    });

    // Return successful response
    const response: UpdateProfileResponse = {
      success: true,
      message: "Profile updated successfully",
      data: {
        nickname: updatedProfile.nickname || "",
      },
    };

    return createSuccessResponse(response, 200);
  } catch (error) {
    // Log error for debugging
    console.error("Error updating user profile:", error);
    return createErrorResponse(error, 500);
  }
};
