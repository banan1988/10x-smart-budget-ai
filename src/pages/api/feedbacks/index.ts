import type { APIRoute } from 'astro';
import { z } from 'zod';
import { FeedbackService } from '../../../lib/services/feedback.service';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * Validation schema for feedback request body using Zod
 */
const FeedbackRequestSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .max(1000, 'Comment must not exceed 1000 characters')
    .optional(),
});

/**
 * Validation schema for pagination query parameters
 */
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Helper function to check if user is admin
 * TODO: Replace with actual admin role check when authentication is implemented
 */
const isAdmin = (userId: string): boolean => {
  // For now, use a hardcoded check
  // In production, this should check user role from database or JWT metadata
  return userId === DEFAULT_USER_ID;
};

/**
 * GET /api/feedbacks
 *
 * Returns a paginated list of all feedback entries.
 * Requires admin privileges.
 *
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 10, max: 100)
 * @returns 200 OK with paginated feedback list
 * @returns 403 Forbidden if user is not admin
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with auth.uid() after authentication is implemented)
    const userId = DEFAULT_USER_ID;

    // Check if user is admin
    if (!isAdmin(userId)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse and validate query parameters
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');

    const validationResult = PaginationSchema.safeParse({
      page: page || undefined,
      limit: limit || undefined,
    });

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
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

    const { page: validatedPage, limit: validatedLimit } = validationResult.data;

    // Fetch feedbacks using the service
    const result = await FeedbackService.getAllFeedback(supabase, {
      page: validatedPage,
      limit: validatedLimit,
    });

    // Return successful response with paginated data
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching feedbacks:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch feedbacks',
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
 * POST /api/feedbacks
 *
 * Creates a new feedback entry for the authenticated user.
 * Requires authentication via middleware.
 *
 * @body FeedbackRequest - { rating: number (1-5), comment?: string (max 1000 chars) }
 * @returns 201 Created with success message
 * @returns 400 Bad Request if validation fails
 * @returns 500 Internal Server Error if operation fails
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate request body with Zod
    const validationResult = FeedbackRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
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

    // Get validated data
    const feedbackData = validationResult.data;

    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with auth.uid() after authentication is implemented)
    const userId = DEFAULT_USER_ID;

    // Create feedback using the service
    await FeedbackService.createFeedback(supabase, userId, feedbackData);

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
    console.error('Error creating feedback:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to create feedback',
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

