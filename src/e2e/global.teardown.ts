import { test as teardown } from "@playwright/test";
import { cleanupTestData } from "../test/mocks/e2e-helpers";

/**
 * Global teardown for E2E tests
 * Cleans up test data for the authenticated test user
 */
teardown("cleanup test data", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !testEmail || !testPassword) {
    throw new Error(
      "Missing required environment variables for E2E teardown: SUPABASE_URL, SUPABASE_KEY, E2E_USERNAME, E2E_PASSWORD"
    );
  }

  await cleanupTestData(supabaseUrl, supabaseAnonKey, testEmail, testPassword);
});
