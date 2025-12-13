import type { APIRoute } from "astro";
import { FeedbackService } from "../../../lib/services/feedback.service";
import { createErrorResponse, createSuccessResponse } from "../../../lib/api-auth";

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

    if (!supabase) {
      return createErrorResponse("Supabase client not available", 500);
    }

    // Fetch feedback statistics using the service
    const stats = await FeedbackService.getFeedbackStats(supabase);

    // Return successful response with statistics
    return createSuccessResponse(stats, 200);
  } catch (error) {
    // Log error for debugging
    console.error("Error fetching feedback stats:", error);
    return createErrorResponse(error, 500);
  }
};
