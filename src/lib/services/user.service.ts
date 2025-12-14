import type { SupabaseClient } from "../../db/supabase.client";
import type { UserProfileDto } from "../../types";

/**
 * Service for managing user data.
 * Handles profile retrieval and user account deletion operations.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class UserService {
  /**
   * Retrieves the profile data for a specific user.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the user whose profile to retrieve
   * @returns Promise resolving to UserProfileDto or null if profile not found
   * @throws Error if database query fails
   */
  static async getUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfileDto | null> {
    // Query the user_profiles table for the specific user
    const { data, error } = await supabase
      .from("user_profiles")
      .select("nickname, preferences")
      .eq("id", userId)
      .single();

    // Handle database errors
    if (error) {
      // If profile not found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Updates the profile data for a specific user.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the user whose profile to update
   * @param updates - The profile fields to update
   * @returns Promise resolving to updated UserProfileDto
   * @throws Error if database update fails
   */
  static async updateUserProfile(
    supabase: SupabaseClient,
    userId: string,
    updates: Partial<UserProfileDto>
  ): Promise<UserProfileDto> {
    // Update the user_profiles table
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select("nickname, preferences")
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Permanently deletes a user account and all associated data.
   * This operation uses the service_role client to delete from auth.users,
   * which triggers cascading deletion of related data.
   *
   * @param supabaseAdmin - The Supabase client with service_role privileges
   * @param userId - The ID of the user to delete
   * @throws Error if deletion fails
   */
  static async deleteUser(supabaseAdmin: SupabaseClient, userId: string): Promise<void> {
    // Delete the user from auth.users using admin client
    // This will cascade delete all related data (user_profiles, transactions, etc.)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}
