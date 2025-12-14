/* eslint-disable no-console */
import type { SupabaseClient } from "../../db/supabase.client";
import { AiCategorizationService } from "./ai-categorization.service";
import { CategoryService } from "./category.service";

/**
 * Service for background AI categorization of transactions.
 * Handles asynchronous categorization that runs in the background without blocking API responses.
 *
 * This service enables better UX by:
 * 1. Creating transactions immediately with "pending" categorization status
 * 2. Running AI categorization in the background
 * 3. Updating the transaction with the category once AI completes
 * 4. Allowing UI to show loading indicator while categorization is in progress
 *
 * @example
 * ```typescript
 * // Create transaction and queue background categorization
 * const service = new BackgroundCategorizationService(supabase);
 * await service.categorizeTransactionInBackground(transactionId, description, userId);
 * // Returns immediately, categorization happens in background
 * ```
 */
export class BackgroundCategorizationService {
  private aiService: AiCategorizationService;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.aiService = new AiCategorizationService(supabase);
  }

  /**
   * Categorizes a transaction asynchronously in the background.
   * Updates the transaction with the AI-determined category without blocking the API response.
   *
   * Process:
   * 1. Calls AI service to get categorization result
   * 2. Finds the corresponding category by key
   * 3. Updates the transaction with category and confidence flags
   * 4. Sets categorization_status to 'completed'
   *
   * Failures are logged but don't propagate - this allows graceful degradation.
   *
   * @param transactionId - ID of the transaction to categorize
   * @param description - Transaction description to analyze
   * @param userId - User ID for authorization and logging
   * @returns Promise that resolves when background categorization is queued (not when completed)
   *
   * @example
   * ```typescript
   * // Queue background categorization - returns immediately
   * await backgroundService.categorizeTransactionInBackground(42, 'Coffee at Starbucks', userId);
   * // Categorization continues in background...
   * ```
   */
  public async categorizeTransactionInBackground(
    transactionId: number,
    description: string,
    userId: string
  ): Promise<void> {
    // Fire-and-forget: Don't await this, let it run in background
    // We intentionally don't return a promise to indicate this is truly async
    this.performBackgroundCategorization(transactionId, description, userId).catch((error) => {
      // Log error but don't fail - background jobs should be resilient
      console.error(
        `Background categorization failed for transaction ${transactionId}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
    });
  }

  /**
   * Internal method that performs the actual background categorization.
   * Handles all error cases gracefully without failing the transaction itself.
   *
   * @private
   * @param transactionId - ID of the transaction to categorize
   * @param description - Transaction description
   * @param userId - User ID for authorization
   */
  private async performBackgroundCategorization(
    transactionId: number,
    description: string,
    userId: string
  ): Promise<void> {
    try {
      // Step 1: Get AI categorization result
      console.log(`[Background] Starting categorization for transaction ${transactionId}`);

      const categorizationResult = await this.aiService.categorizeTransaction(description);

      console.log(`[Background] AI categorization result for transaction ${transactionId}:`, {
        categoryKey: categorizationResult.categoryKey,
        confidence: categorizationResult.confidence,
        reasoning: categorizationResult.reasoning,
      });

      // Step 2: Find category by key
      const category = await CategoryService.getCategoryByKey(this.supabase, categorizationResult.categoryKey);

      if (!category) {
        console.warn(
          `[Background] Category "${categorizationResult.categoryKey}" not found for transaction ${transactionId}`
        );
        // Still mark as completed even if category wasn't found
        await this.markCategorisationComplete(transactionId, userId);
        return;
      }

      // Step 3: Determine if this is a successful AI categorization
      const isSuccessfulCategorization =
        categorizationResult.confidence > 0 &&
        (categorizationResult.categoryKey !== "other" || categorizationResult.confidence >= 0.5);

      // Step 4: Update transaction with category and completion status
      const { error } = await this.supabase
        .from("transactions")
        .update({
          category_id: category.id,
          is_ai_categorized: isSuccessfulCategorization,
          categorization_status: "completed",
        })
        .eq("id", transactionId)
        .eq("user_id", userId);

      if (error) {
        console.error(`[Background] Failed to update transaction ${transactionId} with category:`, error.message);
        // Still try to mark as completed
        await this.markCategorisationComplete(transactionId, userId);
        return;
      }

      console.log(
        `[Background] Successfully categorized transaction ${transactionId} as "${category.name}" ` +
          `(confidence: ${categorizationResult.confidence.toFixed(2)})`
      );
    } catch (error) {
      console.error(
        `[Background] Unexpected error during categorization of transaction ${transactionId}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      // Attempt to mark as completed even on error
      try {
        await this.markCategorisationComplete(transactionId, userId);
      } catch (markError) {
        console.error(
          `[Background] Failed to mark transaction ${transactionId} as completed:`,
          markError instanceof Error ? markError.message : "Unknown error"
        );
      }
    }
  }

  /**
   * Helper method to mark categorization as completed without assigning a category.
   * Used when categorization fails but we need to stop showing the loading state.
   *
   * @private
   * @param transactionId - ID of the transaction
   * @param userId - User ID for authorization
   */
  private async markCategorisationComplete(transactionId: number, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("transactions")
      .update({
        categorization_status: "completed",
      })
      .eq("id", transactionId)
      .eq("user_id", userId);

    if (error) {
      console.error(`Failed to mark transaction ${transactionId} categorization as completed:`, error.message);
    }
  }
}
