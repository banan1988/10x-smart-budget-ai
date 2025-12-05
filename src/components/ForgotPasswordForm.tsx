import { useState, useId } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForgotPasswordForm } from '@/components/hooks/useForgotPasswordForm';

/**
 * Forgot Password Form Component
 *
 * Manages password reset request with email validation.
 * Sends reset instructions to the user's email address.
 */
export default function ForgotPasswordForm() {
  const { state, handleEmailChange, handleBlur, handleSubmit, isFormValid } = useForgotPasswordForm();
  const emailInputId = useId();

  // Show success message after submission
  if (state.isSubmitted) {
    return (
      <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Instrukcje wysłane</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę e-mail</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert variant="default" className="border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20">
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              Wysłaliśmy na adres <strong className="font-semibold">{state.email}</strong> instrukcje do resetowania hasła.
              Kliknij w link zawarty w wiadomości, aby ustawić nowe hasło.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Jeśli nie widzisz wiadomości, sprawdź folder spam lub spróbuj ponownie za kilka minut.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = '/login')}
            >
              Powrót do logowania
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">Resetowanie hasła</CardTitle>
        <CardDescription>
          Podaj swój adres e-mail, a wyślemy Ci instrukcje do zmiany hasła
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* General error message */}
        {state.generalError && (
          <Alert variant="destructive" role="status" aria-live="polite" aria-atomic="true">
            <AlertDescription>{state.generalError}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-5"
        >
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor={emailInputId} className="text-sm font-medium">
              Email
            </Label>
            <Input
              id={emailInputId}
              type="email"
              placeholder="twoj.email@example.com"
              value={state.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={state.isLoading}
              aria-invalid={state.touched.email && !!state.fieldErrors.email}
              aria-describedby={state.touched.email && state.fieldErrors.email ? `${emailInputId}-error` : undefined}
              className="w-full"
            />
            {state.touched.email && state.fieldErrors.email && (
              <p
                id={`${emailInputId}-error`}
                className="text-sm font-medium text-destructive"
                role="alert"
              >
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid || state.isLoading}
            className="w-full py-2 font-semibold"
            aria-busy={state.isLoading}
          >
            {state.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Wysyłanie...</span>
              </div>
            ) : (
              'Wyślij instrukcje'
            )}
          </Button>
        </form>

        {/* Back to login link */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Pamiętasz hasło?{' '}
          <a
            href="/login"
            className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded px-1"
          >
            Zaloguj się
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

