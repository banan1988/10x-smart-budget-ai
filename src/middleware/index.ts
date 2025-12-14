import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Public paths that don't require authentication
 * Includes: auth pages, API endpoints, landing page
 */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/profile/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/callback",
  "/api/feedbacks/stats", // Public endpoint - displays feedback stats on homepage
];

/**
 * Paths that require authentication
 */
const PROTECTED_PATHS = ["/dashboard", "/transactions", "/profile", "/admin"];

/**
 * Paths that require admin role
 */
const ADMIN_PATHS = ["/profile/admin", "/api/admin"];

/**
 * Pages for authenticated users only (should redirect to dashboard if already logged in)
 */
const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/profile/reset-password"];

/**
 * Main middleware function
 * Handles authentication, session management, and route protection
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, url, locals, redirect } = context;

  // Check if route is public
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);
  const isProtectedPath = PROTECTED_PATHS.some((path) => url.pathname.startsWith(path));
  const isAuthPage = AUTH_PAGES.some((path) => url.pathname === path);
  const isAdminPath = ADMIN_PATHS.some((path) => url.pathname.startsWith(path));

  // Create Supabase server instance for this request
  const supabase = createSupabaseServerInstance({
    headers: request.headers,
    cookies,
  });

  // Store Supabase instance in locals for use in API routes
  locals.supabase = supabase;

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set basic user data in locals if authenticated
  if (user) {
    // Set basic user data immediately (from auth session)
    locals.user = {
      id: user.id,
      email: user.email || "",
      role: "user", // Default role - will be updated below if needed
      nickname: undefined,
      createdAt: user.created_at, // Registration date from Supabase auth
    };

    // Fetch user profile only when necessary
    const isAdminApiPath = url.pathname.startsWith("/api/admin");
    const isAdminPagePath = url.pathname.startsWith("/profile/admin");
    const isGetProfileApi = url.pathname === "/api/user/profile" && request.method === "GET";

    // Only fetch profile for:
    // 1. GET /api/user/profile (AppHeader needs this)
    // 2. Admin routes (must verify role before rendering)
    // Skip profile page requests - let AppHeader fetch profile instead
    // This prevents cascading waits when redirecting from admin->profile pages
    const shouldFetchProfile = isGetProfileApi || isAdminPagePath || isAdminApiPath;

    if (shouldFetchProfile) {
      // Create a promise that resolves when profile is actually loaded
      const profileLoadPromise = new Promise<void>((resolve) => {
        supabase
          .from("user_profiles")
          .select("role, nickname")
          .eq("id", user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (!error && profile) {
              // Update locals with fetched profile data
              locals.user.role = profile.role || "user";
              locals.user.nickname = profile.nickname;
            }

            resolve(); // Resolve after profile update
          })
          .catch(() => {
            resolve(); // Resolve even on error
          });

        // Add timeout - don't wait indefinitely
        // Priority order:
        // 1. GET /api/user/profile: 1.5s (critical for AppHeader to get role on startup)
        // 2. Admin page requests: 500ms (fast rejection for non-admin users)
        // 3. Admin API requests: 1.5s (must verify)
        let timeoutMs = 1500; // Default: 1.5s
        if (isAdminPagePath) timeoutMs = 500; // 500ms for admin pages (fast rejection for non-admin users)
        if (isAdminApiPath) timeoutMs = 1500; // 1.5s for admin API
        setTimeout(resolve, timeoutMs);
      });

      // WAIT for profile for admin routes only
      await profileLoadPromise;
    }
  } else {
    // No authenticated user - continue to next middleware
  }

  // Redirect authenticated users from auth pages to dashboard
  if (user && isAuthPage) {
    return redirect("/dashboard");
  }

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtectedPath && !isPublicPath) {
    return redirect("/login");
  }

  // Check if user is trying to access admin paths
  // NOTE: Only redirect for page requests, not API endpoints
  // API endpoints will handle auth checks themselves via checkAdminRole
  if (isAdminPath && !url.pathname.startsWith("/api/")) {
    // Unauthenticated users trying to access admin pages should be redirected to login
    if (!user) {
      return redirect("/login");
    }

    // Authenticated users without admin role should be redirected to profile
    if (user && locals.user?.role !== "admin") {
      return redirect("/profile");
    }
  }

  return next();
});
