import type { Tables, TablesInsert, TablesUpdate } from './db/database.types';

/**
 * Response DTO for a category.
 * The `name` is derived from the `translations` JSON object in the database
 * based on the user's locale.
 */
export type CategoryDto = Pick<Tables<'categories'>, 'id' | 'key'> & {
  name: string;
};

/**
 * Response DTO for a single financial transaction.
 * It omits server-specific fields and includes the resolved category object.
 */
export type TransactionDto = Omit<
  Tables<'transactions'>,
  'category_id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  category: CategoryDto | null;
};

/**
 * Request body for creating a new transaction.
 *
 * @validation
 * - `type`: 'income' or 'expense'. Required.
 * - `amount`: Must be an integer greater than 0. Required.
 * - `description`: Max 255 characters. Required.
 * - `date`: Must be in `YYYY-MM-DD` format. Required.
 */
export type CreateTransactionRequest = Pick<
  TablesInsert<'transactions'>,
  'type' | 'amount' | 'description' | 'date'
>;

/**
 * Request body for updating an existing transaction.
 * All fields are optional.
 *
 * @validation
 * - `type`: 'income' or 'expense'.
 * - `amount`: Must be an integer greater than 0.
 * - `description`: Max 255 characters.
 * - `date`: Must be in `YYYY-MM-DD` format.
 * - `categoryId`: ID of an existing category. Can be `null`.
 */
export type UpdateTransactionRequest = Partial<
  Pick<TablesUpdate<'transactions'>, 'type' | 'amount' | 'description' | 'date'> & {
    categoryId: number | null;
  }
>;

/**
 * Response DTO for the user's profile data.
 */
export type UserProfileDto = Pick<Tables<'user_profiles'>, 'nickname' | 'preferences'>;

/**
 * Response DTO for the main dashboard view.
 * This is a virtual DTO, composed of aggregated data from multiple sources.
 */
export interface DashboardDto {
  income: number;
  expenses: number;
  balance: number;
  spendingChart: {
    categories: { id: number; name: string; total: number }[];
  };
  aiSummary: string;
}

/**
 * Request body for submitting user feedback.
 *
 * @validation
 * - `rating`: Integer between 1 and 5. Required.
 * - `comment`: Max 1000 characters. Optional.
 */
export type FeedbackRequest = Pick<TablesInsert<'feedback'>, 'rating' | 'comment'>;

/**
 * Response DTO for feedback statistics.
 */
export interface FeedbackStatsDto {
  averageRating: number;
  totalFeedbacks: number;
}

/**
 * Response DTO for a single feedback entry, intended for admin use.
 */
export type FeedbackDto = Tables<'feedback'>;
