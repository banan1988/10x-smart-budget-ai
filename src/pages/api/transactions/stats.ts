import type { APIRoute } from 'astro';
import { TransactionService } from '../../../lib/services/transaction.service';
import { GetTransactionStatsQuerySchema } from '../../../types';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * GET /api/transactions/stats
 *
 * Returns statistics for transactions in a specific month.
 * Optionally includes AI-generated summary.
 * Requires authentication via middleware.
 *
 * @query month - The month in YYYY-MM format (required)
 * @query includeAiSummary - Whether to generate AI summary: 'true' or 'false' (optional, default: false)
 * @returns 200 OK with TransactionStatsDto (with optional aiSummary field)
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with authenticated user)
    const userId = DEFAULT_USER_ID;

    // Extract and validate query parameters
    const queryParams = {
      month: url.searchParams.get('month') || undefined,
      includeAiSummary: url.searchParams.get('includeAiSummary') || undefined,
    };

    const validationResult = GetTransactionStatsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch statistics using the service
    const stats = await TransactionService.getStats(
      supabase,
      userId,
      validationResult.data.month,
      validationResult.data.includeAiSummary
    );

    // Return successful response with statistics
    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching transaction stats:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch transaction stats',
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

