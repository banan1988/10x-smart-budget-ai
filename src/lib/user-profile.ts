/**
 * Helper function to fetch user profile from database
 * Should be called only when needed (e.g., in API routes for admin checks)
 * NOT in middleware to avoid performance degradation
 */

import type { SupabaseClient } from '../db/supabase.client';
import type { UserProfile } from '../types';

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role, nickname')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn(`Failed to fetch profile for user ${userId}:`, error.message);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return null;
  }
}

