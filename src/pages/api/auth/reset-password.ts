import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Validation schema for reset password request
 */
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

/**
 * Error response helper
 */
function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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
 * POST /api/auth/reset-password
 *
 * Reset user password using the temporary session from reset link
 * Requires user to be authenticated with a temporary reset token
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError.message, 400);
    }

    const { newPassword }: ResetPasswordRequest = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Check if user is authenticated (should have temporary session from reset link)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // eslint-disable-next-line no-console
      console.error("[Reset Password Auth Error]", userError);
      return errorResponse("Sesja resetowania hasła wygasła. Spróbuj ponownie.", 401);
    }

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("[Reset Password Error]", {
        userId: user.id,
        code: updateError.code,
        message: updateError.message,
      });

      // Return user-friendly error message
      if (updateError.message?.includes("Password")) {
        return errorResponse("Hasło nie spełnia wymagań", 400);
      }

      return errorResponse("Nie udało się zmienić hasła", 500);
    }

    // Sign out user to clear the temporary session
    await supabase.auth.signOut();

    // Return success
    return successResponse({
      message: "Hasło zostało zmienione. Zaloguj się nowym hasłem.",
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[Reset Password Exception]", err);
    return errorResponse("Wewnętrzny błąd serwera", 500);
  }
};
