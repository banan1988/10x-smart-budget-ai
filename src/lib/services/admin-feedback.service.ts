import type { SupabaseClient } from "../../db/supabase.client";
import type { FeedbackDto } from "../../types";

/**
 * Service for managing admin feedback statistics and operations.
 * Handles data retrieval, filtering, and statistical aggregation for admin feedback panel.
 */
export class AdminFeedbackService {
  /**
   * Retrieves all feedback entries with optional filtering and pagination.
   * Used by admin panel to display and analyze user feedback.
   *
   * @param supabase - The Supabase client instance
   * @param filters - Optional filters (startDate, endDate, rating)
   * @param options - Pagination options (page, limit)
   * @returns Promise resolving to paginated feedback data with statistics
   * @throws Error if database query fails
   */
  static async getAdminFeedbacks(
    supabase: SupabaseClient,
    filters?: {
      startDate?: string;
      endDate?: string;
      rating?: number;
    },
    options: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    data: FeedbackDto[];
    stats: {
      total: number;
      averageRating: number;
      ratingDistribution: { rating: number; count: number }[];
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Fetch all feedback with minimal filtering at DB level
      // Details filtering will be done locally for flexibility
      const {
        data: allFeedbacks,
        error: fetchError,
        count,
      } = await supabase.from("feedback").select("*", { count: "exact" }).order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch feedbacks: ${fetchError.message}`);
      }

      if (!allFeedbacks) {
        return {
          data: [],
          stats: {
            total: 0,
            averageRating: 0,
            ratingDistribution: [
              { rating: 5, count: 0 },
              { rating: 4, count: 0 },
              { rating: 3, count: 0 },
              { rating: 2, count: 0 },
              { rating: 1, count: 0 },
            ],
          },
          pagination: {
            page: options.page,
            limit: options.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Apply filters locally
      let filteredFeedbacks = allFeedbacks;

      if (filters?.startDate) {
        filteredFeedbacks = filteredFeedbacks.filter((f) => {
          const feedbackDate = f.created_at.split("T")[0];
          return feedbackDate >= filters.startDate!;
        });
      }

      if (filters?.endDate) {
        filteredFeedbacks = filteredFeedbacks.filter((f) => {
          const feedbackDate = f.created_at.split("T")[0];
          return feedbackDate <= filters.endDate!;
        });
      }

      if (filters?.rating) {
        filteredFeedbacks = filteredFeedbacks.filter((f) => f.rating === filters.rating);
      }

      // Calculate statistics
      const totalFiltered = filteredFeedbacks.length;
      const averageRating =
        totalFiltered > 0
          ? Math.round((filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFiltered) * 100) / 100
          : 0;

      const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: filteredFeedbacks.filter((f) => f.rating === rating).length,
      }));

      // Apply pagination
      const totalPages = Math.ceil(totalFiltered / options.limit);
      const from = (options.page - 1) * options.limit;
      const to = from + options.limit;
      const paginatedFeedbacks = filteredFeedbacks.slice(from, to);

      return {
        data: paginatedFeedbacks,
        stats: {
          total: totalFiltered,
          averageRating,
          ratingDistribution,
        },
        pagination: {
          page: options.page,
          limit: options.limit,
          total: totalFiltered,
          totalPages,
        },
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error("Unknown error while fetching admin feedbacks");
    }
  }

  /**
   * Calculates trend data comparing two date ranges.
   * Used to show if average rating is improving or declining.
   *
   * @param supabase - The Supabase client instance
   * @param currentStartDate - Start of current period (YYYY-MM-DD)
   * @param currentEndDate - End of current period (YYYY-MM-DD)
   * @param previousStartDate - Start of previous period (YYYY-MM-DD)
   * @param previousEndDate - End of previous period (YYYY-MM-DD)
   * @returns Trend info with direction and percentage change
   */
  static async calculateTrend(
    supabase: SupabaseClient,
    currentStartDate: string,
    currentEndDate: string,
    previousStartDate: string,
    previousEndDate: string
  ): Promise<{
    direction: "up" | "down" | "neutral";
    percentage: number;
  }> {
    try {
      const { data: currentFeedbacks } = await supabase
        .from("feedback")
        .select("rating")
        .gte("created_at", currentStartDate)
        .lte("created_at", currentEndDate);

      const { data: previousFeedbacks } = await supabase
        .from("feedback")
        .select("rating")
        .gte("created_at", previousStartDate)
        .lte("created_at", previousEndDate);

      const currentAvg =
        currentFeedbacks && currentFeedbacks.length > 0
          ? currentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / currentFeedbacks.length
          : 0;

      const previousAvg =
        previousFeedbacks && previousFeedbacks.length > 0
          ? previousFeedbacks.reduce((sum, f) => sum + f.rating, 0) / previousFeedbacks.length
          : 0;

      if (previousAvg === 0) {
        return { direction: "neutral", percentage: 0 };
      }

      const percentageChange = Math.round(((currentAvg - previousAvg) / previousAvg) * 100);

      if (percentageChange > 0) {
        return { direction: "up", percentage: percentageChange };
      } else if (percentageChange < 0) {
        return { direction: "down", percentage: Math.abs(percentageChange) };
      } else {
        return { direction: "neutral", percentage: 0 };
      }
    } catch {
      return { direction: "neutral", percentage: 0 };
    }
  }
}
