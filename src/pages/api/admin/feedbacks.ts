import type { APIRoute } from "astro";
import { z } from "zod";
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

// Zod schema for validating query parameters
const AdminFeedbacksQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  rating: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 || num > 5 ? undefined : num;
    }),
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 1 : Math.max(num, 1);
    }),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) return 20;
      return Math.min(Math.max(num, 1), 100); // Between 1 and 100
    }),
});

/**
 * GET /api/admin/feedbacks
 *
 * Returns paginated list of all feedback entries for admin panel.
 * Requires admin role authorization.
 *
 * @query startDate - Start date in YYYY-MM-DD format (optional)
 * @query endDate - End date in YYYY-MM-DD format (optional)
 * @query rating - Filter by rating 1-5 (optional)
 * @query page - Page number for pagination (optional, default: 1)
 * @query limit - Items per page (optional, default: 20, max: 100)
 * @returns 200 OK with paginated feedback data
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 403 Forbidden if user doesn't have admin role
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) {
      if (errorResponse) return errorResponse;
      return createErrorResponse("Unauthorized", 401);
    }

    // Check if user is admin
    const [isAdmin, adminError] = await checkAdminRole(context);
    if (!isAdmin) {
      if (adminError) return adminError;
      return createErrorResponse("Forbidden", 403);
    }

    const { locals, url } = context;
    if (!locals.supabase) {
      return createErrorResponse("Database connection error", 500);
    }
    const supabase = locals.supabase;

    // Parse and validate query parameters
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const rating = url.searchParams.get("rating");
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");

    const validationResult = AdminFeedbacksQuerySchema.safeParse({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      rating: rating || undefined,
      page: page || undefined,
      limit: limit || undefined,
    });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    const {
      startDate: validatedStartDate,
      endDate: validatedEndDate,
      rating: validatedRating,
      page: validatedPage,
      limit: validatedLimit,
    } = validationResult.data;

    // Fetch all feedbacks using the service
    const allFeedbacksResult = await FeedbackService.getAllFeedback(supabase, {
      page: 1,
      limit: 1000, // Fetch large number to filter locally
    });

    let filteredFeedbacks = allFeedbacksResult.data;

    // Apply date range filter
    if (validatedStartDate || validatedEndDate) {
      filteredFeedbacks = filteredFeedbacks.filter((feedback) => {
        const feedbackDate = feedback.created_at.split("T")[0];

        if (validatedStartDate && feedbackDate < validatedStartDate) {
          return false;
        }
        if (validatedEndDate && feedbackDate > validatedEndDate) {
          return false;
        }

        return true;
      });
    }

    // Apply rating filter
    if (validatedRating) {
      filteredFeedbacks = filteredFeedbacks.filter((feedback) => feedback.rating === validatedRating);
    }

    // Calculate pagination
    const totalFiltered = filteredFeedbacks.length;
    const totalPages = Math.ceil(totalFiltered / validatedLimit);
    const from = (validatedPage - 1) * validatedLimit;
    const to = from + validatedLimit;

    // Apply pagination
    const paginatedFeedbacks = filteredFeedbacks.slice(from, to);

    // Return successful response with paginated data
    return createSuccessResponse(
      {
        data: paginatedFeedbacks,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: totalFiltered,
          totalPages,
        },
      },
      200
    );
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Error fetching admin feedbacks:", error);

    // Return error response
    return createErrorResponse(error, 500);
  }
};
