import { useState, useId } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResetPasswordForm, type PasswordStrengthLevel } from '@/components/hooks/useResetPasswordForm';

/**
 * Password Strength Indicator Component
 */
interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
}

function PasswordStrengthIndicator({ password, showDetails = true }: PasswordStrengthIndicatorProps) {
  const { getPasswordStrength } = useResetPasswordForm();

  if (!password) {
    return null;
  }

  const strength = getPasswordStrength();
  const { requirements } = strength;

  const strengthColors: Record<PasswordStrengthLevel, { bg: string; text: string; label: string }> = {
    'weak': { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Słabe' },
    'medium': { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', label: 'Średnie' },
    'strong': { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', label: 'Silne' },
    'very-strong': { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', label: 'Bardzo silne' },
  };

  const colors = strengthColors[strength.level];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Siła hasła</span>
          <span className={`text-sm font-semibold ${colors.text}`}>{colors.label}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} transition-all duration-300`}
            style={{ width: `${strength.score}%` }}
          ></div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Wymagania:</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2 text-sm">
              {requirements.minLength ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span className={requirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                Minimum 8 znaków
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasUppercase ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span className={requirements.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                Wielka litera (A-Z)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasLowercase ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span className={requirements.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                Mała litera (a-z)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasDigit ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span className={requirements.hasDigit ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                Cyfra (0-9)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasSpecialChar ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span className={requirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}>
                Znak specjalny (!@#$...)
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Reset Password Form Component
 *
 * Manages password reset with new password validation and strength indicator.
 * Used on the password reset page after user clicks the reset link from email.
 */
export default function ResetPasswordForm() {
  const {
    state,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleBlur,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    handleSubmit,
    isFormValid,
  } = useResetPasswordForm();

  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">Nowe hasło</CardTitle>
        <CardDescription>Ustaw nowe hasło do swojego konta</CardDescription>
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
          noValidate
        >
          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor={passwordInputId} className="text-sm font-medium">
              Nowe hasło
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={passwordInputId}
                type={state.showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={state.newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur('newPassword')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && isFormValid) {
                    handleSubmit();
                  }
                }}
                disabled={state.isLoading}
                aria-invalid={state.touched.newPassword && !!state.fieldErrors.newPassword}
                aria-describedby={
                  state.touched.newPassword && state.fieldErrors.newPassword
                    ? `${passwordInputId}-error`
                    : `${passwordInputId}-requirements`
                }
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={state.showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                disabled={state.isLoading}
              >
                {state.showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {state.newPassword && (
              <div id={`${passwordInputId}-requirements`} className="mt-3">
                <PasswordStrengthIndicator password={state.newPassword} showDetails={true} />
              </div>
            )}

            {state.touched.newPassword && state.fieldErrors.newPassword && (
              <p
                id={`${passwordInputId}-error`}
                className="text-sm font-medium text-destructive"
                role="alert"
              >
                {state.fieldErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor={confirmPasswordInputId} className="text-sm font-medium">
              Potwierdź hasło
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={confirmPasswordInputId}
                type={state.showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={state.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && isFormValid) {
                    handleSubmit();
                  }
                }}
                disabled={state.isLoading}
                aria-invalid={state.touched.confirmPassword && !!state.fieldErrors.confirmPassword}
                aria-describedby={
                  state.touched.confirmPassword && state.fieldErrors.confirmPassword
                    ? `${confirmPasswordInputId}-error`
                    : undefined
                }
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={state.showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                disabled={state.isLoading}
              >
                {state.showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {state.touched.confirmPassword && state.fieldErrors.confirmPassword && (
              <p
                id={`${confirmPasswordInputId}-error`}
                className="text-sm font-medium text-destructive"
                role="alert"
              >
                {state.fieldErrors.confirmPassword}
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
                <span>Zmiana hasła...</span>
              </div>
            ) : (
              'Zmień hasło'
            )}
          </Button>
        </form>

        {/* Back to login link */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <a
            href="/login"
            className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded px-1"
          >
            Powrót do logowania
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

