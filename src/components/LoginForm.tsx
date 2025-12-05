import { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLoginForm } from '@/components/hooks/useLoginForm';

/**
 * Login Form Component
 *
 * Manages user authentication with email and password.
 * Handles form validation, error display, and submission.
 */
export default function LoginForm() {
  const { state, handleEmailChange, handlePasswordChange, handleBlur, handleSubmit, isFormValid } = useLoginForm();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Generate unique IDs for accessibility
  const emailInputId = useId();
  const passwordInputId = useId();
  const errorRegionId = useId();

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">Logowanie</CardTitle>
        <CardDescription>Zaloguj się do swojego konta SmartBudgetAI</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* General error message - accessible with aria-live */}
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
              aria-invalid={state.touched.email && !!state.emailError}
              aria-describedby={state.touched.email && state.emailError ? `${emailInputId}-error` : undefined}
              className="w-full"
            />
            {state.touched.email && state.emailError && (
              <p
                id={`${emailInputId}-error`}
                className="text-sm font-medium text-destructive"
                role="alert"
              >
                {state.emailError}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={passwordInputId} className="text-sm font-medium">
                Hasło
              </Label>
              <a
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded px-1"
              >
                Zapomniałeś hasła?
              </a>
            </div>
            <div className="relative">
              <Input
                id={passwordInputId}
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="••••••"
                value={state.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur('password')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && isFormValid) {
                    handleSubmit();
                  }
                }}
                disabled={state.isLoading}
                aria-invalid={state.touched.password && !!state.passwordError}
                aria-describedby={state.touched.password && state.passwordError ? `${passwordInputId}-error` : undefined}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                aria-label={isPasswordVisible ? 'Ukryj hasło' : 'Pokaż hasło'}
                aria-pressed={isPasswordVisible}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {isPasswordVisible ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {state.touched.password && state.passwordError && (
              <p
                id={`${passwordInputId}-error`}
                className="text-sm font-medium text-destructive"
                role="alert"
              >
                {state.passwordError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full py-2 font-semibold"
            aria-busy={state.isLoading}
          >
            {state.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Logowanie...</span>
              </div>
            ) : (
              'Zaloguj się'
            )}
          </Button>
        </form>

        {/* Sign up link */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Nie masz konta?{' '}
          <a
            href="/register"
            className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded px-1"
          >
            Zarejestruj się
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
