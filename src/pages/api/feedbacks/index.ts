import type { APIRoute } from "astro";
import { CreateFeedbackCommandSchema } from "../../../types";
import { FeedbackService } from "../../../lib/services/feedback.service";
import {
  checkAuthentication,
  checkAdminRole,
  createValidationErrorResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../../../lib/api-auth";

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
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 403 Forbidden if user is not admin
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    // Check if user is admin
    const [isAdmin, adminError] = await checkAdminRole(context);
    if (!isAdmin) return adminError!;

    const { locals, url } = context;
    const supabase = locals.supabase!;

    // Parse and validate pagination parameters
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const page = pageParam ? Math.max(parseInt(pageParam, 10) || DEFAULT_PAGE, 1) : DEFAULT_PAGE;
    let limit = limitParam ? parseInt(limitParam, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT;

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }

    if (limit > MAX_LIMIT) {
      return createValidationErrorResponse({
        message: `Limit must not exceed ${MAX_LIMIT}`,
      });
    }

    // Fetch feedbacks using service
    const result = await FeedbackService.getAllFeedback(supabase, { page, limit });

    // Return success response with pagination
    return createSuccessResponse(
      {
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      200
    );
  } catch (error) {
    console.error("Error in GET /api/feedbacks:", error);
    return createErrorResponse(error, 500);
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
export const POST: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals, request } = context;
    const supabase = locals.supabase!;
    const userId = locals.user!.id;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          message: "The request body must be valid JSON",
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
    const validationResult = CreateFeedbackCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error.issues);
    }

    // Create feedback using service
    const feedback = await FeedbackService.createFeedback(supabase, userId, validationResult.data);

    // Return success response with created feedback
    return createSuccessResponse(feedback, 201);
  } catch (error) {
    console.error("Error in POST /api/feedbacks:", error);
    return createErrorResponse(error, 500);
  }
};
