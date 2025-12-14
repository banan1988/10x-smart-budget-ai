import type { APIRoute } from "astro";
import { TransactionService } from "../../../lib/services/transaction.service";
import { BulkCreateTransactionsCommandSchema, BulkDeleteTransactionsCommandSchema } from "../../../types";
import {
  checkAuthentication,
  createValidationErrorResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../../../lib/api-auth";

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * POST /api/transactions/bulk
 *
 * Bulk create transactions (1-100 at once).
 * Requires authentication via middleware.
 *
 * @body BulkCreateTransactionsCommand
 * @returns 201 Created with array of created TransactionDto
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const POST: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse ?? new Response("Unauthorized", { status: 401 });

    const { locals, request } = context;
    const supabase =
      locals.supabase ??
      (() => {
        throw new Error("Supabase client not available");
      })();
    const userId =
      locals.user?.id ??
      (() => {
        throw new Error("User ID not available");
      })();

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validationResult = BulkCreateTransactionsCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error.issues);
    }

    // Bulk create transactions using the service
    const transactions = await TransactionService.bulkCreateTransactions(supabase, userId, validationResult.data);

    // Return successful response with created transactions
    const successResponse = createSuccessResponse(
      {
        created: transactions.length,
        transactions,
      },
      201
    );

    // Add headers to indicate that related caches should be invalidated
    // The client-side hook (useDashboardStats) will refetch due to onSuccess callback
    successResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return successResponse;
  } catch (err) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Error bulk creating transactions:", err);
    return createErrorResponse(err, 500);
  }
};

/**
 * DELETE /api/transactions/bulk
 *
 * Bulk delete transactions by IDs (1-100 at once).
 * Requires authentication via middleware.
 *
 * @body BulkDeleteTransactionsCommand
 * @returns 200 OK with number of deleted transactions
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse ?? new Response("Unauthorized", { status: 401 });

    const { locals, request } = context;
    const supabase =
      locals.supabase ??
      (() => {
        throw new Error("Supabase client not available");
      })();
    const userId =
      locals.user?.id ??
      (() => {
        throw new Error("User ID not available");
      })();

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validationResult = BulkDeleteTransactionsCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(validationResult.error.issues);
    }

    // Bulk delete transactions using the service
    const deletedCount = await TransactionService.bulkDeleteTransactions(supabase, userId, validationResult.data.ids);

    // Return successful response
    const deleteResponse = createSuccessResponse(
      {
        deleted: deletedCount,
      },
      200
    );

    // Add headers to indicate that related caches should be invalidated
    deleteResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return deleteResponse;
  } catch (err) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Error bulk deleting transactions:", err);
    return createErrorResponse(err, 500);
  }
};
