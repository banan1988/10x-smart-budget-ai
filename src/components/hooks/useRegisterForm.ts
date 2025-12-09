import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Password strength validation requirements
 */
interface PasswordStrengthRequirements {
  minLength: boolean; // minimum 8 characters
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
}

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number; // 0-100
  requirements: PasswordStrengthRequirements;
}

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  generalError: string | null;
  touched: {
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
  };
  fieldErrors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Evaluates password strength based on requirements
 */
function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordStrengthRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Calculate score (0-100)
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const score = (metRequirements / 5) * 100;

  // Determine level
  let level: PasswordStrengthLevel = 'weak';
  if (score >= 80 && requirements.minLength && requirements.hasUppercase && requirements.hasLowercase && requirements.hasDigit && requirements.hasSpecialChar) {
    level = 'very-strong';
  } else if (score >= 60) {
    level = 'strong';
  } else if (score >= 40) {
    level = 'medium';
  }

  return { level, score, requirements };
}

/**
 * Custom hook for managing register form state and validation
 */
export function useRegisterForm() {
  const [state, setState] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    generalError: null,
    touched: {
      email: false,
      password: false,
      confirmPassword: false,
    },
    fieldErrors: {},
  });

  /**
   * Validates email and updates state
   */
  const handleEmailChange = useCallback((email: string) => {
    setState((prev) => {
      const newState = { ...prev, email };

      if (prev.touched.email) {
        if (!email) {
          newState.fieldErrors = { ...prev.fieldErrors, email: 'Email jest wymagany' };
        } else if (!isValidEmail(email)) {
          newState.fieldErrors = { ...prev.fieldErrors, email: 'Wprowadź prawidłowy adres email' };
        } else {
          const { email: _, ...rest } = prev.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      return newState;
    });
  }, []);

  /**
   * Validates password and updates state
   */
  const handlePasswordChange = useCallback((password: string) => {
    setState((prev) => {
      const newState = { ...prev, password };

      if (prev.touched.password) {
        const strength = evaluatePasswordStrength(password);
        const allRequirementsMet = Object.values(strength.requirements).every(Boolean);

        if (!password) {
          newState.fieldErrors = { ...prev.fieldErrors, password: 'Hasło jest wymagane' };
        } else if (!allRequirementsMet) {
          newState.fieldErrors = { ...prev.fieldErrors, password: 'Hasło nie spełnia wszystkich wymagań' };
        } else {
          const { password: _, ...rest } = prev.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      // Re-validate confirmPassword if it's touched
      if (prev.touched.confirmPassword && prev.confirmPassword) {
        if (password !== prev.confirmPassword) {
          newState.fieldErrors = { ...newState.fieldErrors, confirmPassword: 'Hasła nie są identyczne' };
        } else {
          // Passwords now match - clear the error
          const { confirmPassword, ...rest } = newState.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      return newState;
    });
  }, []);

  /**
   * Validates confirm password and updates state
   */
  const handleConfirmPasswordChange = useCallback((confirmPassword: string) => {
    setState((prev) => {
      const newState = { ...prev, confirmPassword };

      if (prev.touched.confirmPassword) {
        if (!confirmPassword) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Potwierdzenie hasła jest wymagane' };
        } else if (confirmPassword !== prev.password) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Hasła nie są identyczne' };
        } else {
          // Passwords match - clear the error
          const { confirmPassword: _, ...rest } = prev.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      return newState;
    });
  }, []);

  /**
   * Handles field blur event for validation
   */
  const handleBlur = useCallback((field: keyof FormState['touched']) => {
    setState((prev) => {
      const newState = { ...prev, touched: { ...prev.touched, [field]: true } };

      // Trigger validation for the field
      if (field === 'email') {
        if (!prev.email) {
          newState.fieldErrors = { ...prev.fieldErrors, email: 'Email jest wymagany' };
        } else if (!isValidEmail(prev.email)) {
          newState.fieldErrors = { ...prev.fieldErrors, email: 'Wprowadź prawidłowy adres email' };
        }
      } else if (field === 'password') {
        const strength = evaluatePasswordStrength(prev.password);
        const allRequirementsMet = Object.values(strength.requirements).every(Boolean);

        if (!prev.password) {
          newState.fieldErrors = { ...prev.fieldErrors, password: 'Hasło jest wymagane' };
        } else if (!allRequirementsMet) {
          newState.fieldErrors = { ...prev.fieldErrors, password: 'Hasło nie spełnia wszystkich wymagań' };
        }
      } else if (field === 'confirmPassword') {
        if (!prev.confirmPassword) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Potwierdzenie hasła jest wymagane' };
        } else if (prev.confirmPassword !== prev.password) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Hasła nie są identyczne' };
        }
      }

      return newState;
    });
  }, []);

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  }, []);

  /**
   * Toggles confirm password visibility
   */
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setState((prev) => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }));
  }, []);

  /**
   * Validates form before submission
   */
  const validateForm = (): boolean => {
    let errors: typeof state.fieldErrors = {};
    let isValid = true;

    // Validate email
    if (!state.email) {
      errors.email = 'Email jest wymagany';
      isValid = false;
    } else if (!isValidEmail(state.email)) {
      errors.email = 'Wprowadź prawidłowy adres email';
      isValid = false;
    }

    // Validate password
    const passwordStrength = evaluatePasswordStrength(state.password);
    const passwordRequirementsMet = Object.values(passwordStrength.requirements).every(Boolean);

    if (!state.password) {
      errors.password = 'Hasło jest wymagane';
      isValid = false;
    } else if (!passwordRequirementsMet) {
      errors.password = 'Hasło nie spełnia wszystkich wymagań';
      isValid = false;
    }

    // Validate confirm password
    if (!state.confirmPassword) {
      errors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
      isValid = false;
    } else if (state.confirmPassword !== state.password) {
      errors.confirmPassword = 'Hasła nie są identyczne';
      isValid = false;
    }

    if (!isValid) {
      setState((prev) => ({
        ...prev,
        fieldErrors: errors,
        touched: { email: true, password: true, confirmPassword: true },
      }));
    }

    return isValid;
  };

  /**
   * Gets password strength information
   */
  const getPasswordStrength = useCallback((): PasswordStrengthResult => {
    return evaluatePasswordStrength(state.password);
  }, [state.password]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(async () => {
    // Validate form first
    if (!validateForm()) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, generalError: null }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 409) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            fieldErrors: {
              ...prev.fieldErrors,
              email: 'Ten adres email jest już zarejestrowany',
            },
            generalError: 'Rejestracja nie powiodła się. Ten email już istnieje w systemie.',
          }));
          toast.error('Ten adres email jest już zarejestrowany');
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            generalError: errorData.error || 'Rejestracja nie powiodła się. Spróbuj ponownie.',
          }));
          toast.error(errorData.error || 'Rejestracja nie powiodła się. Spróbuj ponownie.');
        }
        return;
      }

      // Success - show success message
      const data = await response.json();

      // Show success message about email verification
      // NOTE: In production with email sending enabled, user would receive email verification link
      // For local Supabase setup without email sending, the account is created and ready to use
      setState((prev) => ({
        ...prev,
        isLoading: false,
        generalError: null,
      }));

      // Show success notification
      toast.success(data.message || 'Konto zostało utworzone pomyślnie!');

      // Redirect to dashboard since user is already authenticated after signup
      // Supabase automatically creates session on signup
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd podczas rejestracji';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        generalError: `Błąd: ${errorMessage}. Spróbuj ponownie.`,
      }));

      toast.error(`Błąd: ${errorMessage}`);
      console.error('Register error:', error);
    }
  }, [state.email, state.password]);

  /**
   * Checks if form is valid for submission
   */
  const isFormValid: boolean =
    !!state.email &&
    !!state.password &&
    !!state.confirmPassword &&
    !state.isLoading &&
    Object.keys(state.fieldErrors).length === 0;

  return {
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
  };
}

