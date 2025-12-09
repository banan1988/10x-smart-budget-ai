import type { APIRoute } from 'astro';
import { TransactionService } from '../../../lib/services/transaction.service';
import { UpdateTransactionCommandSchema } from '../../../types';
import { checkAuthentication, createValidationErrorResponse, createErrorResponse, createSuccessResponse } from '../../../lib/api-auth';

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
export const PUT: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals, params, request } = context;
    const supabase = locals.supabase!;
    const userId = locals.user!.id;

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
      return createValidationErrorResponse(validationResult.error.issues);
    }

    // Update transaction using the service
    const transaction = await TransactionService.updateTransaction(
      supabase,
      userId,
      transactionId,
      validationResult.data
    );

    // Return successful response with updated transaction
    const updateResponse = createSuccessResponse(transaction, 200);

    // Add headers to indicate that related caches should be invalidated
    updateResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return updateResponse;
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
    return createErrorResponse(error, 500);
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
export const DELETE: APIRoute = async (context) => {
  try {
    // Check if user is authenticated
    const [isAuth, errorResponse] = checkAuthentication(context);
    if (!isAuth) return errorResponse!;

    const { locals, params } = context;
    const supabase = locals.supabase!;
    const userId = locals.user!.id;

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
    const deleteResponse = new Response(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    return deleteResponse;
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
    return createErrorResponse(error, 500);
  }
};

