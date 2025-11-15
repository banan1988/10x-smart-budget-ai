import type { APIRoute } from 'astro';
import { FeedbackService } from '../../../lib/services/feedback.service';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * GET /api/feedbacks/stats
 *
 * Returns aggregated feedback statistics including average rating and total count.
 * This endpoint is PUBLIC and doesn't require authentication.
 * It's designed to be displayed on the homepage to encourage user engagement.
 *
 * @returns 200 OK with FeedbackStatsDto object
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // Fetch feedback statistics using the service
    const stats = await FeedbackService.getFeedbackStats(supabase);

    // Return successful response with statistics
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching feedback stats:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch feedback statistics',
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

