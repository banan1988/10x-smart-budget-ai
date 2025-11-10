import type { APIRoute } from 'astro';
import { CategoryService } from '../../lib/services/category.service';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * GET /api/categories
 *
 * Returns a list of all global categories.
 * Requires authentication via middleware.
 *
 * @returns 200 OK with array of CategoryDto objects
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // Fetch categories using the service
    const categories = await CategoryService.getGlobalCategories(supabase);

    // Return successful response with categories
    return new Response(
      JSON.stringify(categories),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching categories:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch categories',
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

