import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Validation schema for register request
 */
const registerSchema = z.object({
  email: z.string().email("Wprowadź prawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * Error response helper
 */
function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Success response helper
 */
function successResponse(data: Record<string, unknown>, status = 201) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/auth/register
 *
 * Register new user with email and password
 * In production: Sends verification email to user
 * In local dev (with local Supabase): No email sent - user can immediately log in
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError.message, 400);
    }

    const { email, password }: RegisterRequest = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Attempt to sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Handle Supabase auth errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[Register Error]", {
        email,
        code: error.code,
        message: error.message,
      });

      // Return user-friendly error messages
      if (error.code === "user_already_exists" || error.message?.includes("already registered")) {
        return errorResponse("Ten adres email jest już zarejestrowany", 409);
      }

      if (error.message?.includes("Password")) {
        return errorResponse("Hasło nie spełnia wymagań", 400);
      }

      // Generic error for other cases
      return errorResponse("Nie udało się zarejestrować. Spróbuj ponownie później.", 500);
    }

    // Success - return user data
    // NOTE: In production with email sending enabled, user would need to verify email
    // For local Supabase setup without email sending, the account is created and ready to use
    return successResponse(
      {
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: "Konto zostało utworzone pomyślnie! Możesz teraz się zalogować.",
      },
      201
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Register Exception]", err);
    return errorResponse("Wewnętrzny błąd serwera", 500);
  }
};
