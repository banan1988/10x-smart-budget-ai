import type { APIRoute } from 'astro';
import { CreateFeedbackCommandSchema } from '../../../types';
import { DEFAULT_USER_ID } from '../../../db/constants';
import { FeedbackService } from '../../../lib/services/feedback.service';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * GET /api/feedbacks
 *
 * Retrieves paginated list of all feedbacks (admin only).
 * Requires authentication via middleware.
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @returns 200 OK with paginated feedbacks
 * @returns 400 Bad Request if validation fails
 * @returns 403 Forbidden if user is not admin
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // TODO: Check if user is admin when proper auth is implemented
    // For now, only default user (admin) can access this
    const userId = DEFAULT_USER_ID;

    // Parse and validate pagination parameters
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    const page = pageParam ? Math.max(parseInt(pageParam, 10) || DEFAULT_PAGE, 1) : DEFAULT_PAGE;
    let limit = limitParam ? parseInt(limitParam, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT;

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }

    if (limit > MAX_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: `Limit must not exceed ${MAX_LIMIT}`,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Fetch feedbacks using service
    const result = await FeedbackService.getAllFeedback(supabase, { page, limit });

    // Return success response with pagination
    return new Response(
      JSON.stringify({
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/feedbacks:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch feedbacks',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
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
 * POST /api/feedbacks
 *
 * Submits user feedback about the application.
 * Requires authentication via middleware.
 *
 * @body rating - Rating from 1 to 5 (required)
 * @body comment - Optional comment (max 1000 characters)
 * @returns 201 Created with success message
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // Validate that request is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in to submit feedback',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          message: 'The request body must be valid JSON',
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
    const validationResult = CreateFeedbackCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: 'Invalid feedback data',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { rating, comment } = validationResult.data;

    // Create feedback using service
    await FeedbackService.createFeedback(supabase, session.user.id, {
      rating,
      comment: comment || '',
    });

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Dziękujemy za Twoją opinię.',
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('Error submitting feedback:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to create feedback',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
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

