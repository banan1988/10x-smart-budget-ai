import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";
import { z } from "zod";

/**
 * Constants for transactions and categories
 */
export const UNCATEGORIZED_CATEGORY_KEY = "uncategorized";
export const UNCATEGORIZED_CATEGORY_NAME = "Do kategoryzacji AI";

/**
 * Response DTO for a category.
 * The `name` is derived from the `translations` JSON object in the database
 * based on the user's locale.
 */
export type CategoryDto = Pick<Tables<"categories">, "id" | "key"> & {
  name: string;
};

/**
 * Response DTO for a single financial transaction.
 * It omits server-specific fields and includes the resolved category object.
 *
 * @property categorization_status - Status of AI categorization:
 *   - 'pending': Transaction created, waiting for AI categorization in background
 *   - 'completed': Categorization finished (either successful or fallback)
 */
export type TransactionDto = Omit<Tables<"transactions">, "category_id" | "user_id" | "created_at" | "updated_at"> & {
  category: CategoryDto | null;
  categorization_status: "pending" | "completed";
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
export type CreateTransactionRequest = Pick<TablesInsert<"transactions">, "type" | "amount" | "description" | "date">;

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
  Pick<TablesUpdate<"transactions">, "type" | "amount" | "description" | "date"> & {
    categoryId: number | null;
  }
>;

/**
 * Zod schema for validating GET /api/transactions query parameters
 */
export const GetTransactionsQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
    .refine(
      (val) => {
        const [, month] = val.split("-").map(Number);
        return month >= 1 && month <= 12;
      },
      {
        message: "Month must be between 01 and 12",
      }
    ),
  // Filtering
  categoryId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n));
    }),
  type: z.enum(["income", "expense"]).optional(),
  search: z.string().max(255).optional(),
  // Pagination
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

export type GetTransactionsQuery = z.infer<typeof GetTransactionsQuerySchema>;

/**
 * Zod schema for validating POST /api/transactions request body
 */
export const CreateTransactionCommandSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().int().positive("Amount must be a positive integer"),
  description: z.string().min(1, "Description is required").max(255, "Description must not exceed 255 characters"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  categoryId: z.number().int().nullable().optional(),
});

export type CreateTransactionCommand = z.infer<typeof CreateTransactionCommandSchema>;

/**
 * Zod schema for validating PUT /api/transactions/[id] request body
 */
export const UpdateTransactionCommandSchema = z
  .object({
    type: z.enum(["income", "expense"]).optional(),
    amount: z.number().int().positive("Amount must be a positive integer").optional(),
    description: z
      .string()
      .min(1, "Description is required")
      .max(255, "Description must not exceed 255 characters")
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    categoryId: z.number().int().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateTransactionCommand = z.infer<typeof UpdateTransactionCommandSchema>;

/**
 * Zod schema for bulk creating transactions
 */
export const BulkCreateTransactionsCommandSchema = z.object({
  transactions: z.array(CreateTransactionCommandSchema).min(1).max(100),
});

export type BulkCreateTransactionsCommand = z.infer<typeof BulkCreateTransactionsCommandSchema>;

/**
 * Zod schema for bulk deleting transactions
 */
export const BulkDeleteTransactionsCommandSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export type BulkDeleteTransactionsCommand = z.infer<typeof BulkDeleteTransactionsCommandSchema>;

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response DTO for transaction statistics with optional AI-generated summary
 */
export interface TransactionStatsDto {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: {
    categoryId: number | null;
    categoryName: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  dailyBreakdown: {
    date: string;
    income: number;
    expenses: number;
  }[];
  aiCategorizedCount: number;
  manualCategorizedCount: number;
  aiSummary?: string; // Optional AI-generated summary
}

/**
 * Zod schema for validating GET /api/transactions/stats query parameters
 */
export const GetTransactionStatsQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
    .refine(
      (val) => {
        const [, month] = val.split("-").map(Number);
        return month >= 1 && month <= 12;
      },
      {
        message: "Month must be between 01 and 12",
      }
    ),
  includeAiSummary: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type GetTransactionStatsQuery = z.infer<typeof GetTransactionStatsQuerySchema>;

/**
 * Response DTO for the user's profile data.
 */
export type UserProfileDto = Pick<Tables<"user_profiles">, "nickname" | "preferences">;

/**
 * ViewModel for the Profile page.
 * Combines data from the user's profile and session.
 */
export interface ProfilePageVM {
  email: string;
  nickname: string | null;
  registeredAt: string; // ISO format: "2025-01-15T10:30:00.000Z"
  preferences: Record<string, unknown> | null;
}

/**
 * Request DTO for feedback submission.
 *
 * @validation
 * - `rating`: Must be an integer between 1 and 5. Required.
 * - `comment`: Max 1000 characters. Optional.
 */
export interface FeedbackRequest {
  rating: number;
  comment: string;
}

/**
 * Zod schema for validating POST /api/feedbacks request body
 */
export const CreateFeedbackCommandSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(1000, "Comment must not exceed 1000 characters").optional().default(""),
});

export type CreateFeedbackCommand = z.infer<typeof CreateFeedbackCommandSchema>;

/**
 * Response DTO for feedback submission.
 */
export interface FeedbackResponse {
  message: string;
}

/**
 * Form data for feedback form (internal state)
 */
export interface FeedbackFormData {
  rating: number | null;
  comment: string;
}

/**
 * ViewModel for FeedbackButton component
 */
export interface FeedbackButtonVM {
  isAuthenticated: boolean;
  userId?: string;
}

/**
 * ViewModel for FeedbackDialog component
 */
export interface FeedbackDialogVM {
  isOpen: boolean;
  title: string;
  description?: string;
}

/**
 * Response DTO for a single feedback entry.
 */
export interface FeedbackDto {
  id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/**
 * Response DTO for feedback statistics (average rating and total count).
 */
export interface FeedbackStatsDto {
  averageRating: number;
  totalFeedbacks: number;
}

/**
 * ViewModel for the ProfileCard component.
 * Contains data needed to display the profile card.
 */
export interface ProfileCardData {
  email: string;
  nickname: string | null;
  registeredAt: string;
}

/**
 * ViewModel for the Profile Settings page.
 * Used to pass data from server (Astro) to React components.
 */
export type ProfileSettingsPageVM = ProfilePageVM;

/**
 * Request body for submitting user feedback.
 *
 * @validation
 * - `rating`: Integer between 1 and 5. Required.
 * - `comment`: Max 1000 characters. Optional.
 */
export type FeedbackRequest = Pick<TablesInsert<"feedback">, "rating" | "comment">;

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
export type FeedbackDto = Tables<"feedback">;

/**
 * Filter state for feedbacks view (admin)
 */
export interface FeedbackFilters {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  rating?: number; // 1-5 or undefined for all
  page?: number; // 1-based
  limit?: number; // Results per page
}

/**
 * ViewModel for displaying a feedback row in the admin table
 */
export interface FeedbackRowVM {
  id: number;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string; // Formatted date, e.g., "15 października 2025"
  rawCreatedAt: string; // Original ISO timestamp for filtering
}

/**
 * ViewModel for feedback statistics in admin panel
 */
export interface AdminFeedbackStatsVM {
  totalFeedbacks: number;
  averageRating: number;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage?: number;
  };
}

/**
 * Response type for feedback admin endpoint
 */
export interface AdminFeedbacksResponse {
  data: FeedbackDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ViewModel for displaying a transaction in the UI
 */
export interface TransactionVM {
  id: number;
  type: "income" | "expense";
  amount: string; // Formatted amount with currency, e.g., "50,00 zł"
  description: string;
  date: string; // Formatted date, e.g., "15 października 2025"
  rawDate: string; // Original date in YYYY-MM-DD format for editing
  categoryName: string;
  categoryKey: string;
  isAiCategorized: boolean;
  categorizationStatus: "pending" | "completed"; // pending: waiting for AI categorization, completed: finished
}

/**
 * Filter state for transactions view
 */
export interface TransactionFilters {
  month: string; // YYYY-MM
  page?: number;
  limit?: number;
  type?: "income" | "expense";
  categoryId?: number[];
  search?: string;
}

/**
 * ViewModel for a single metric card on the dashboard
 */
export interface MetricCardVM {
  title: string; // e.g., "Przychody"
  value: string; // Formatted amount, e.g., "10 000,00 zł"
  variant?: "income" | "expense" | "balance-positive" | "balance-negative"; // Color variant
}

/**
 * ViewModel for a single category breakdown on the chart
 */
export interface CategoryBreakdownVM {
  name: string; // Category name, e.g., "Jedzenie"
  total: number; // Total amount for this category
  percentage?: number; // Optional percentage
}

/**
 * ViewModel for daily income/expense breakdown
 */
export interface DailyBreakdownVM {
  date: string; // Date in YYYY-MM-DD format
  day: string; // Day of month, e.g., "1", "2", etc.
  income: number; // Total income for this day
  expenses: number; // Total expenses for this day
}

/**
 * ViewModel for the entire dashboard
 */
export interface DashboardVM {
  metrics: MetricCardVM[];
  categoryBreakdown: CategoryBreakdownVM[];
  dailyBreakdown: DailyBreakdownVM[];
  aiSummary?: string;
}

/**
 * ViewModel for the profile page (/profile)
 * Contains user profile information including email from session and profile data
 */
export interface ProfilePageVM {
  email: string;
  nickname: string | null;
  registeredAt: string; // ISO format: "2025-01-15T10:30:00.000Z"
  preferences: Record<string, unknown> | null;
}

/**
 * ViewModel for the profile settings page (/profile/settings)
 * Same as ProfilePageVM but used in settings context
 */
export type ProfileSettingsPageVM = ProfilePageVM;

/**
 * ViewModel for the ProfileCard component
 * Contains minimal data needed to display profile information card
 */
export interface ProfileCardData {
  email: string;
  nickname: string | null;
  registeredAt: string; // ISO format date
}

/**
 * Form data for editing user profile
 */
export interface EditProfileFormData {
  nickname: string;
}

/**
 * Request body for updating user profile
 */
export interface UpdateProfileRequest {
  nickname: string;
}

/**
 * Response DTO for successful profile update
 */
export interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    nickname: string;
  };
}

/**
 * Validation error DTO
 */
export interface ValidationError {
  field: string; // e.g., "nickname"
  message: string; // e.g., "Nickname is too long. Maximum 50 characters."
}

/**
 * Request body for submitting user feedback.
 *
 * @validation
 * - `rating`: Integer between 1 and 5. Required.
 * - `comment`: Max 1000 characters. Optional.
 */
export type FeedbackRequest = Pick<TablesInsert<"feedback">, "rating" | "comment">; /**
 * Zod schema for validating PUT /api/user/profile request body
 */
export const UpdateProfileCommandSchema = z.object({
  nickname: z
    .string()
    .max(50, "Nickname must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]*$/, "Nickname can only contain letters, numbers, spaces, hyphens, and underscores")
    .optional()
    .or(z.literal(null)),
});

export type UpdateProfileCommand = z.infer<typeof UpdateProfileCommandSchema>;

/**
 * Category statistics for AI categorization breakdown
 */
export interface CategoryStats {
  categoryId: number;
  categoryName: string;
  categoryKey: string;
  aiCount: number;
  manualCount: number;
  total: number;
  aiPercentage: number;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage?: number;
  };
}

/**
 * Response DTO for AI categorization statistics
 */
export interface AiCategorizationStatsDto {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalTransactions: number;
    aiCategorized: number;
    manuallyCategorized: number;
    aiPercentage: number;
  };
  categoryBreakdown: CategoryStats[];
  trendData: {
    date: string;
    percentage: number;
  }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
