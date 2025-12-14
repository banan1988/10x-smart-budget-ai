import { createClient } from "@supabase/supabase-js";

/**
 * Reusable helper functions for E2E test setup and teardown
 */

/**
 * Verifies that the test user exists and can authenticate
 * @param supabaseUrl - Supabase project URL
 * @param supabaseAnonKey - Supabase anon key
 * @param testEmail - Email for the test user
 * @param testPassword - Password for the test user
 */
export async function verifyTestUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  testEmail: string,
  testPassword: string
) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Attempt to sign in with test credentials to verify user exists
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (error) {
    throw new Error(`Test user verification failed: ${error.message}`);
  }

  if (!data.user) {
    throw new Error("Test user authentication succeeded but no user data returned");
  }

  // Sign out immediately to avoid session conflicts
  await supabase.auth.signOut();

  return data.user;
}

/**
 * Cleans up test data for an authenticated user from Supabase
 * @param supabaseUrl - Supabase project URL
 * @param supabaseAnonKey - Supabase anon key
 * @param testEmail - Email for the test user
 * @param testPassword - Password for the test user
 */
export async function cleanupTestData(
  supabaseUrl: string,
  supabaseAnonKey: string,
  testEmail: string,
  testPassword: string
) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in as test user to get authenticated session
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to authenticate test user for cleanup: ${authError?.message || "No user data"}`);
  }

  // Clean up transactions for the authenticated user
  await supabase.from("transactions").delete().eq("user_id", authData.user.id);

  // Clean up feedback for the authenticated user
  await supabase.from("feedback").delete().eq("user_id", authData.user.id);

  // Sign out
  await supabase.auth.signOut();
}
