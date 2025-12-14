import type { APIRoute } from "astro";
import { CategoryService } from "../../lib/services/category.service";
import { checkAuthentication, createErrorResponse, createSuccessResponse } from "../../lib/api-auth";

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * GET /api/categories
 *
 * Returns a list of all global categories.
 * Requires authentication via middleware.
 *
 * @returns 200 OK with array of CategoryDto objects
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse ?? new Response("Unauthorized", { status: 401 });

    const { locals } = context;
    const supabase =
      locals.supabase ??
      (() => {
        throw new Error("Supabase client not available");
      })();

    // Fetch categories using the service
    const categories = await CategoryService.getGlobalCategories(supabase);

    // Return successful response with categories
    return createSuccessResponse(categories, 200);
  } catch (err) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Error fetching categories:", err);

    // Return error response
    return createErrorResponse(err, 500);
  }
};
