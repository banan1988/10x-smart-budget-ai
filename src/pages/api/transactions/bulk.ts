import type { APIRoute } from 'astro';
import { TransactionService } from '../../../lib/services/transaction.service';
import { BulkCreateTransactionsCommandSchema, BulkDeleteTransactionsCommandSchema } from '../../../types';
import { DEFAULT_USER_ID } from '../../../db/constants';

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
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with authenticated user)
    const userId = DEFAULT_USER_ID;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const validationResult = BulkCreateTransactionsCommandSchema.safeParse(body);

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

    // Bulk create transactions using the service
    const transactions = await TransactionService.bulkCreateTransactions(
      supabase,
      userId,
      validationResult.data
    );

    // Return successful response with created transactions
    return new Response(
      JSON.stringify({
        created: transactions.length,
        transactions,
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
    console.error('Error bulk creating transactions:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to bulk create transactions',
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
export const DELETE: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with authenticated user)
    const userId = DEFAULT_USER_ID;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const validationResult = BulkDeleteTransactionsCommandSchema.safeParse(body);

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

    // Bulk delete transactions using the service
    const deletedCount = await TransactionService.bulkDeleteTransactions(
      supabase,
      userId,
      validationResult.data.ids
    );

    // Return successful response
    return new Response(
      JSON.stringify({
        deleted: deletedCount,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('Error bulk deleting transactions:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to bulk delete transactions',
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

