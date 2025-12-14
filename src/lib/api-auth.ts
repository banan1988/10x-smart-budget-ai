/**
 * API Authentication and Authorization Helpers
 *
 * Provides utilities for protecting API endpoints and checking user authentication
 */

import type { APIContext } from "astro";

/**
 * Response structure for API errors
 */
interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Check if user is authenticated and return appropriate response if not
 *
 * @param context - Astro APIContext
 * @returns tuple of [isAuthenticated: boolean, errorResponse?: Response]
 *
 * @example
 * export const GET: APIRoute = async (context) => {
 *   const [isAuth, errorResponse] = checkAuthentication(context);
 *   if (!isAuth) return errorResponse!;
 *   // ... rest of the handler
 * }
 */
export function checkAuthentication(context: APIContext): [isAuthenticated: boolean, errorResponse?: Response] {
  const { locals } = context;

  // Check if user is authenticated
  if (!locals.user) {
    return [
      false,
      new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        } as ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      ),
    ];
  }

  // Check if Supabase client is available
  if (!locals.supabase) {
    return [
      false,
      new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Supabase client not available",
        } as ApiErrorResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      ),
    ];
  }

  return [true];
}

/* eslint-disable no-console */
/**
 * Check if user has admin role
 *
 * @param context - Astro APIContext
 * @returns tuple of [isAdmin: boolean, errorResponse?: Response]
 *
 * @example
 * export const DELETE: APIRoute = async (context) => {
 *   const [isAuth, errorResponse] = checkAuthentication(context);
 *   if (!isAuth) return errorResponse!;
 *
 *   const [isAdmin, adminError] = checkAdminRole(context);
 *   if (!isAdmin) return adminError!;
 *   // ... rest of the handler
 * }
 */
export async function checkAdminRole(context: APIContext): Promise<[isAdmin: boolean, errorResponse?: Response]> {
  const { locals } = context;

  console.log("[checkAdminRole] Checking admin role for user:", {
    userId: locals.user?.id,
    userRole: locals.user?.role,
    hasSupabase: !!locals.supabase,
  });

  // If role is already loaded in locals (from middleware cache), use it
  if (locals.user?.role) {
    if (locals.user.role === "admin") {
      console.log("[checkAdminRole] User has admin role from locals");
      return [true];
    } else {
      console.log("[checkAdminRole] User has non-admin role:", locals.user.role);
      return [
        false,
        new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Admin role required",
          } as ApiErrorResponse),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
      ];
    }
  }

  // If role is not in locals and we need to check it, fetch from database
  if (locals.user?.id && locals.supabase) {
    console.log("[checkAdminRole] Fetching role from database for user:", locals.user.id);
    try {
      const { data, error } = await locals.supabase
        .from("user_profiles")
        .select("role")
        .eq("id", locals.user.id)
        .single();

      if (error) {
        console.error("[checkAdminRole] Database error:", error.message);
      }

      if (!data) {
        console.log("[checkAdminRole] No profile found for user:", locals.user.id);
        // Default to non-admin if profile not found
        return [
          false,
          new Response(
            JSON.stringify({
              error: "Forbidden",
              message: "Admin role required",
            } as ApiErrorResponse),
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
              },
            }
          ),
        ];
      }

      // Check if role is admin
      if (data.role === "admin") {
        console.log("[checkAdminRole] User has admin role from database");
        // Cache the role in locals for this request
        if (locals.user) {
          locals.user.role = "admin";
        }
        return [true];
      } else {
        console.log("[checkAdminRole] User role from database:", data.role);
        return [
          false,
          new Response(
            JSON.stringify({
              error: "Forbidden",
              message: "Admin role required",
            } as ApiErrorResponse),
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
              },
            }
          ),
        ];
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      return [
        false,
        new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Admin role required",
          } as ApiErrorResponse),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
      ];
    }
  }

  return [
    false,
    new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Admin role required",
      } as ApiErrorResponse),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    ),
  ];
}

/**
 * Create a validation error response
 *
 * @param details - Validation error details
 * @returns Response with 400 status
 *
 * @example
 * if (!validationResult.success) {
 *   return createValidationErrorResponse(validationResult.error.issues);
 * }
 */
export function createValidationErrorResponse(details: unknown): Response {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details,
    } as ApiErrorResponse & { details: unknown }),
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Create an error response
 *
 * @param error - Error object or message
 * @param statusCode - HTTP status code (default 500)
 * @returns Response with specified status
 *
 * @example
 * try {
 *   // ... handler logic
 * } catch (error) {
 *   return createErrorResponse(error, 500);
 * }
 */
export function createErrorResponse(error: unknown, statusCode = 500): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  const errorName = error instanceof Error ? error.name : "Error";

  return new Response(
    JSON.stringify({
      error: errorName,
      message,
    } as ApiErrorResponse),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Create a success response
 *
 * @param data - Response data
 * @param statusCode - HTTP status code (default 200)
 * @returns Response with specified status and data
 *
 * @example
 * const result = { id: '123', name: 'John' };
 * return createSuccessResponse(result, 201);
 */
export function createSuccessResponse(data: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
