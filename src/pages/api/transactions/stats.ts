import type { APIRoute } from 'astro';
import { TransactionService } from '../../../lib/services/transaction.service';
import { GetTransactionStatsQuerySchema } from '../../../types';
import { checkAuthentication, createValidationErrorResponse, createErrorResponse, createSuccessResponse } from '../../../lib/api-auth';

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
export const GET: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals, url } = context;
    const supabase = locals.supabase!;
    const userId = locals.user!.id;

    // Extract and validate query parameters
    const queryParams = {
      month: url.searchParams.get('month') || undefined,
      includeAiSummary: url.searchParams.get('includeAiSummary') || undefined,
    };

    const validationResult = GetTransactionStatsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error.issues);
    }

    // Fetch statistics using the service
    const stats = await TransactionService.getStats(
      supabase,
      userId,
      validationResult.data.month,
      validationResult.data.includeAiSummary
    );

    // Return successful response with statistics
    // Cache for 60 seconds, allow stale content for up to 10 minutes while revalidating in background
    const response = createSuccessResponse(stats, 200);
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=600');
    return response;
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching transaction stats:', error);

    // Return error response
    return createErrorResponse(error, 500);
  }
};

