import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Success response helper
 */
function successResponse(data: Record<string, unknown> = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/auth/logout
 * Logs out the current user and clears session cookies
 *
 * Important: Uses a timeout for Supabase signOut() to prevent hanging requests
 * when Supabase API is unavailable. Supabase handles cookie clearing automatically.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Attempt to sign out from Supabase with a 2-second timeout
    // This prevents the request from hanging if Supabase is unavailable
    // Supabase will automatically clear cookies when signOut is successful
    const signOutPromise = supabase.auth.signOut();
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ error: { message: "Supabase timeout" } }), 2000)
    );

    const result = await Promise.race([signOutPromise, timeoutPromise]);

    if (result.error) {
      // Log the error but don't fail the logout
      // eslint-disable-next-line no-console
      console.warn("[Logout Warning] Supabase signOut failed or timed out:", result.error.message);
    }

    // Return success - Supabase handles cookie clearing, middleware will redirect to login
    return successResponse({ message: "Wylogowano pomyślnie" });
  } catch (err) {
    // Catch any unexpected errors but still return success
    // because session will be cleared on next request anyway
    const errorMessage = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn("[Logout Exception] Error during logout, but session will be cleared:", errorMessage);

    // Return success anyway - user is already logged out from our perspective
    return successResponse({ message: "Wylogowano pomyślnie" });
  }
};
