import type { APIRoute } from 'astro';
import { TransactionService } from '../../../lib/services/transaction.service';
import { UpdateTransactionCommandSchema } from '../../../types';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

/**
 * PUT /api/transactions/[id]
 *
 * Updates an existing transaction.
 * Requires authentication via middleware.
 *
 * @param id - The transaction ID (URL parameter)
 * @body UpdateTransactionCommand
 * @returns 200 OK with the updated TransactionDto
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if transaction doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error if operation fails
 */
export const PUT: APIRoute = async ({ locals, params, request }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with authenticated user)
    const userId = DEFAULT_USER_ID;

    // Extract and validate transaction ID from URL params
    const transactionId = parseInt(params.id || '', 10);
    if (isNaN(transactionId)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid transaction ID',
          message: 'Transaction ID must be a valid integer',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

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

    const validationResult = UpdateTransactionCommandSchema.safeParse(body);

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

    // Update transaction using the service
    const transaction = await TransactionService.updateTransaction(
      supabase,
      userId,
      transactionId,
      validationResult.data
    );

    // Return successful response with updated transaction
    return new Response(
      JSON.stringify(transaction),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Log error for debugging
    console.error('Error updating transaction:', error);

    // Check if it's a not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: error.message,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: 'Failed to update transaction',
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
 * DELETE /api/transactions/[id]
 *
 * Deletes an existing transaction.
 * Requires authentication via middleware.
 *
 * @param id - The transaction ID (URL parameter)
 * @returns 204 No Content if successful
 * @returns 400 Bad Request if ID is invalid
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if transaction doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error if operation fails
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    // Get Supabase client from middleware context
    const supabase = locals.supabase;

    // For now, use default user ID (will be replaced with authenticated user)
    const userId = DEFAULT_USER_ID;

    // Extract and validate transaction ID from URL params
    const transactionId = parseInt(params.id || '', 10);
    if (isNaN(transactionId)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid transaction ID',
          message: 'Transaction ID must be a valid integer',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Delete transaction using the service
    await TransactionService.deleteTransaction(
      supabase,
      userId,
      transactionId
    );

    // Return successful response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error deleting transaction:', error);

    // Check if it's a not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: error.message,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: 'Failed to delete transaction',
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

