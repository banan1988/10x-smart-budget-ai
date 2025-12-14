import { test as setup } from "@playwright/test";
import { verifyTestUser } from "../test/mocks/e2e-helpers";

/**
 * Global setup for E2E tests
 * Verifies that the test user exists and can authenticate
 */
setup("verify test user", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !testEmail || !testPassword) {
    throw new Error(
      "Missing required environment variables for E2E setup: SUPABASE_URL, SUPABASE_KEY, E2E_USERNAME, E2E_PASSWORD"
    );
  }

  await verifyTestUser(supabaseUrl, supabaseAnonKey, testEmail, testPassword);
});
