import type { APIRoute } from "astro";
import { TransactionService } from "../../lib/services/transaction.service";
import { GetTransactionsQuerySchema, CreateTransactionCommandSchema } from "../../types";
import { DEFAULT_USER_ID } from "../../db/constants";

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * GET /api/transactions
 *
 * Returns a paginated list of transactions for a specific month with optional filters.
 * Requires authentication via middleware.
 *
 * @query month - The month in YYYY-MM format (required)
 * @query categoryId - Comma-separated category IDs (optional)
 * @query type - Transaction type: 'income' or 'expense' (optional)
 * @query search - Search in description (optional)
 * @query page - Page number, default 1 (optional)
 * @query limit - Items per page, default 20, max 100 (optional)
 * @returns 200 OK with paginated array of TransactionDto objects
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    console.log("[GET /api/transactions] Request received", {
      pathname: url.pathname,
      query: url.search,
      hasUser: !!locals.user,
      userId: locals.user?.id,
    });

    // Check if user is authenticated
    if (!locals.user) {
      console.log("[GET /api/transactions] Unauthorized - no user in locals");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Supabase client not available",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use authenticated user's ID
    const userId = locals.user.id;

    // Extract and validate query parameters
    const month = url.searchParams.get("month");

    // Early validation - month is required
    if (!month) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: [{ message: "Month parameter is required" }],
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const queryParams = {
      month,
      categoryId: url.searchParams.get("categoryId") || undefined,
      type: url.searchParams.get("type") || undefined,
      search: url.searchParams.get("search") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = GetTransactionsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fetch transactions using the service
    const result = await TransactionService.getTransactions(supabase, userId, validationResult.data);

    // Return successful response with paginated transactions
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error fetching transactions:", error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: "Failed to fetch transactions",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * POST /api/transactions
 *
 * Creates a new transaction.
 * For expenses, automatically categorizes using AI.
 * Requires authentication via middleware.
 *
 * @body CreateTransactionCommand
 * @returns 201 Created with the created TransactionDto
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 500 Internal Server Error if operation fails
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Supabase client not available",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use authenticated user's ID
    const userId = locals.user.id;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
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

    const validationResult = CreateTransactionCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create transaction using the service
    const transaction = await TransactionService.createTransaction(supabase, userId, validationResult.data);

    // Return successful response with created transaction
    return new Response(JSON.stringify(transaction), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error creating transaction:", error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: "Failed to create transaction",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
