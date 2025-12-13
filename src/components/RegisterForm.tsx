import { useState, useId } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRegisterForm, type PasswordStrengthLevel } from "@/components/hooks/useRegisterForm";

/**
 * Password Strength Result interface
 */
interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigit: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Password Strength Indicator Component Props
 */
interface PasswordStrengthIndicatorProps {
  strength: PasswordStrengthResult;
  showDetails?: boolean;
}

function PasswordStrengthIndicator({ strength, showDetails = true }: PasswordStrengthIndicatorProps) {
  const { requirements } = strength;

  // Map strength level to color
  const strengthColors: Record<PasswordStrengthLevel, { bg: string; text: string; label: string }> = {
    weak: { bg: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Słabe" },
    medium: { bg: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400", label: "Średnie" },
    strong: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", label: "Silne" },
    "very-strong": { bg: "bg-green-500", text: "text-green-600 dark:text-green-400", label: "Bardzo silne" },
  };

  const colors = strengthColors[strength.level];

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
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

      {/* Requirements Checklist */}
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
              <span
                className={
                  requirements.minLength ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
                }
              >
                Minimum 8 znaków
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasUppercase ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span
                className={
                  requirements.hasUppercase
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-600 dark:text-slate-400"
                }
              >
                Wielka litera (A-Z)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasLowercase ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span
                className={
                  requirements.hasLowercase
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-600 dark:text-slate-400"
                }
              >
                Mała litera (a-z)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasDigit ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span
                className={
                  requirements.hasDigit ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
                }
              >
                Cyfra (0-9)
              </span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              {requirements.hasSpecialChar ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-slate-400" />
              )}
              <span
                className={
                  requirements.hasSpecialChar
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-600 dark:text-slate-400"
                }
              >
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
 * Register Form Component
 *
 * Manages user registration with email and password.
 * Handles form validation, password strength indicator, and submission.
 */
export default function RegisterForm() {
  const {
    state,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleBlur,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    handleSubmit,
    getPasswordStrength,
    isFormValid,
  } = useRegisterForm();

  // Generate unique IDs for accessibility
  const emailInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();
  const errorRegionId = useId();

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold">Rejestracja</CardTitle>
        <CardDescription>Utwórz nowe konto SmartBudgetAI</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* General error message - accessible with aria-live */}
        {state.generalError && (
          <Alert variant="destructive" role="status" aria-live="polite" aria-atomic="true" id={errorRegionId}>
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
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor={emailInputId} className="text-sm font-medium">
              Email
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id={emailInputId}
              type="email"
              placeholder="twoj.email@example.com"
              value={state.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => handleBlur("email")}
              disabled={state.isLoading}
              aria-invalid={state.touched.email && !!state.fieldErrors.email}
              aria-describedby={state.touched.email && state.fieldErrors.email ? `${emailInputId}-error` : undefined}
              className="w-full"
              maxLength={255}
            />
            {state.touched.email && state.fieldErrors.email && (
              <p id={`${emailInputId}-error`} className="text-sm font-medium text-destructive" role="alert">
                {state.fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor={passwordInputId} className="text-sm font-medium">
              Hasło
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={passwordInputId}
                type={state.showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={state.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur("password")}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && isFormValid) {
                    handleSubmit();
                  }
                }}
                disabled={state.isLoading}
                aria-invalid={state.touched.password && !!state.fieldErrors.password}
                aria-describedby={
                  state.touched.password && state.fieldErrors.password
                    ? `${passwordInputId}-error`
                    : `${passwordInputId}-requirements`
                }
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={state.showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                disabled={state.isLoading}
              >
                {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {state.password && (
              <div id={`${passwordInputId}-requirements`} className="mt-3">
                <PasswordStrengthIndicator strength={getPasswordStrength()} showDetails={true} />
              </div>
            )}

            {state.touched.password && state.fieldErrors.password && (
              <p id={`${passwordInputId}-error`} className="text-sm font-medium text-destructive" role="alert">
                {state.fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor={confirmPasswordInputId} className="text-sm font-medium">
              Potwierdzenie hasła
              <span className="text-destructive ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id={confirmPasswordInputId}
                type={state.showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={state.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && isFormValid) {
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
                aria-label={state.showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                disabled={state.isLoading}
              >
                {state.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {state.touched.confirmPassword && state.fieldErrors.confirmPassword && (
              <p id={`${confirmPasswordInputId}-error`} className="text-sm font-medium text-destructive" role="alert">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Privacy Policy Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-md p-3 text-sm text-slate-700 dark:text-slate-300">
            <p>
              Rejestrując się, zgadzasz się z naszą{" "}
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                polityką prywatności
              </a>{" "}
              i{" "}
              <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                warunkami użytkowania
              </a>
              .
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={!isFormValid || state.isLoading} className="w-full h-10" size="lg">
            {state.isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Rejestrowanie...
              </>
            ) : (
              "Zarejestruj się"
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Masz już konto?{" "}
              <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Zaloguj się
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
