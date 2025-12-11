import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

/**
 * Validation schema for forgot password request
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Wprowadź prawidłowy adres email'),
});

type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

/**
 * Error response helper
 */
function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any = {}, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * POST /api/auth/forgot-password
 *
 * Send password reset email to user
 * Returns 200 OK regardless of whether email exists to avoid user enumeration
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate request body
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError.message, 400);
    }

    const { email }: ForgotPasswordRequest = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Get the base URL from request
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/profile/reset-password`;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });

    // Always return success to prevent user enumeration
    // Even if user doesn't exist, we say we sent the email
    if (error) {
      console.error('[Forgot Password Error]', {
        email,
        code: error.code,
        message: error.message,
      });
    }

    // Return success response (regardless of whether email exists)
    return successResponse({
      message: 'Jeśli istnieje konto z tym adresem email, wysłaliśmy instrukcje do resetowania hasła',
    });

  } catch (err) {
    console.error('[Forgot Password Exception]', err);
    // Even on error, don't reveal if user exists
    return successResponse({
      message: 'Jeśli istnieje konto z tym adresem email, wysłaliśmy instrukcje do resetowania hasła',
    });
  }
};

