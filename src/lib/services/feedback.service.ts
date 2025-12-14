import type { SupabaseClient } from "../../db/supabase.client";
import type { FeedbackRequest, FeedbackStatsDto, FeedbackDto } from "../../types";

/**
 * Service for managing user feedback.
 * Handles data submission, retrieval, and statistical aggregation for feedback operations.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FeedbackService {
  /**
   * Creates a new feedback entry for a user.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the user submitting the feedback
   * @param data - The feedback data (rating and optional comment)
   * @returns Promise resolving to the created FeedbackDto
   * @throws Error if database insertion fails
   */
  static async createFeedback(supabase: SupabaseClient, userId: string, data: FeedbackRequest): Promise<FeedbackDto> {
    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        user_id: userId,
        rating: data.rating,
        comment: data.comment || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create feedback: ${error.message}`);
    }

    if (!feedback) {
      throw new Error("Failed to create feedback: No data returned");
    }

    return feedback;
  }

  /**
   * Retrieves aggregated feedback statistics.
   * Calculates the average rating and total count of all feedback entries.
   *
   * @param supabase - The Supabase client instance
   * @returns Promise resolving to FeedbackStatsDto with averageRating and totalFeedbacks
   * @throws Error if database query fails
   */
  static async getFeedbackStats(supabase: SupabaseClient): Promise<FeedbackStatsDto> {
    // Query all feedback ratings
    const { data, error } = await supabase.from("feedback").select("rating", { count: "exact" });

    if (error) {
      throw new Error(`Failed to fetch feedback stats: ${error.message}`);
    }

    // Handle empty result
    if (!data || data.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
      };
    }

    // Calculate average rating
    const totalRating = data.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = totalRating / data.length;

    return {
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      totalFeedbacks: data.length,
    };
  }

  /**
   * Retrieves a paginated list of all feedback entries.
   * Intended for admin use only. Results are ordered by creation date (newest first).
   *
   * @param supabase - The Supabase client instance
   * @param page - The page number (1-based)
   * @param limit - The number of results per page
   * @returns Promise resolving to an object containing feedback data and pagination info
   * @throws Error if database query fails
   */
  static async getAllFeedback(
    supabase: SupabaseClient,
    options: { page: number; limit: number }
  ): Promise<{
    data: FeedbackDto[];
    page: number;
    limit: number;
    total: number;
  }> {
    const { page, limit } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Query feedback with pagination
    const { data, error, count } = await supabase
      .from("feedback")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }

    return {
      data: data || [],
      page,
      limit,
      total: count || 0,
    };
  }
}
