import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

/**
 * Validation schema for login request
 */
const loginSchema = z.object({
  email: z.string().email('Wprowadź prawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Error response helper
 */
function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { status }
  );
}

/**
 * POST /api/auth/login
 *
 * Authenticate user with email and password
 * Sets session cookies and returns user data
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Login Exception] Failed to parse JSON body', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return errorResponse('Nieprawidłowy format żądania', 400);
    }

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError.message, 400);
    }

    const { email, password }: LoginRequest = validation.data;

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle Supabase auth errors
    if (error) {
      console.error('[Login Error]', {
        email,
        code: error.code,
        message: error.message,
        status: error.status,
      });

      // Return user-friendly error message without exposing implementation details
      if (error.code === 'invalid_credentials') {
        return errorResponse('Email lub hasło są nieprawidłowe', 401);
      }

      if (error.code === 'email_not_confirmed') {
        return errorResponse('Proszę potwierdź swój adres email', 403);
      }

      if (error.code === 'user_not_found') {
        return errorResponse('Użytkownik nie istnieje', 404);
      }

      // Generic error for other cases
      return errorResponse('Nie udało się zalogować. Spróbuj ponownie później.', 500);
    }

    // Fetch user profile to get role and nickname for immediate return to client
    const supabaseForProfile = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    const { data: profile, error: profileError } = await supabaseForProfile
      .from('user_profiles')
      .select('role, nickname')
      .eq('id', data.user?.id)
      .single();

    const userRole = profile?.role || 'user';
    const userNickname = profile?.nickname || '';

    console.log('[Login] User logged in successfully:', {
      userId: data.user?.id,
      email: data.user?.email,
      role: userRole,
      nickname: userNickname,
    });

    // Success - return user data with role
    return successResponse({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: userRole,
        nickname: userNickname,
      },
    }, 200);

  } catch (err) {
    console.error('[Login Exception] Unexpected error', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return errorResponse('Wewnętrzny błąd serwera', 500);
  }
};

