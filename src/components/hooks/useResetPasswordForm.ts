import { useState, useCallback } from 'react';

/**
 * Password strength validation requirements
 */
interface PasswordStrengthRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
}

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number;
  requirements: PasswordStrengthRequirements;
}

interface FormState {
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  generalError: string | null;
  touched: {
    newPassword: boolean;
    confirmPassword: boolean;
  };
  fieldErrors: {
    newPassword?: string;
    confirmPassword?: string;
  };
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

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const score = (metRequirements / 5) * 100;

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
 * Custom hook for managing reset password form state and validation
 */
export function useResetPasswordForm() {
  const [state, setState] = useState<FormState>({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    generalError: null,
    touched: {
      newPassword: false,
      confirmPassword: false,
    },
    fieldErrors: {},
  });

  /**
   * Validates password and updates state
   */
  const handlePasswordChange = useCallback((password: string) => {
    setState((prev) => {
      const newState = { ...prev, newPassword: password };

      if (prev.touched.newPassword) {
        const strength = evaluatePasswordStrength(password);
        const allRequirementsMet = Object.values(strength.requirements).every(Boolean);

        if (!password) {
          newState.fieldErrors = { ...prev.fieldErrors, newPassword: 'Hasło jest wymagane' };
        } else if (!allRequirementsMet) {
          newState.fieldErrors = { ...prev.fieldErrors, newPassword: 'Hasło nie spełnia wszystkich wymagań' };
        } else {
          const { newPassword: _, ...rest } = prev.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      if (prev.touched.confirmPassword && prev.confirmPassword && password !== prev.confirmPassword) {
        newState.fieldErrors = { ...newState.fieldErrors, confirmPassword: 'Hasła nie są identyczne' };
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
        } else if (confirmPassword !== prev.newPassword) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Hasła nie są identyczne' };
        } else {
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

      if (field === 'newPassword') {
        const strength = evaluatePasswordStrength(prev.newPassword);
        const allRequirementsMet = Object.values(strength.requirements).every(Boolean);

        if (!prev.newPassword) {
          newState.fieldErrors = { ...prev.fieldErrors, newPassword: 'Hasło jest wymagane' };
        } else if (!allRequirementsMet) {
          newState.fieldErrors = { ...prev.fieldErrors, newPassword: 'Hasło nie spełnia wszystkich wymagań' };
        }
      } else if (field === 'confirmPassword') {
        if (!prev.confirmPassword) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Potwierdzenie hasła jest wymagane' };
        } else if (prev.confirmPassword !== prev.newPassword) {
          newState.fieldErrors = { ...prev.fieldErrors, confirmPassword: 'Hasła nie są identyczne' };
        }
      }

      return newState;
    });
  }, []);

  /**
   * Handle submit
   */
  const handleSubmit = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      touched: {
        newPassword: true,
        confirmPassword: true,
      },
    }));

    const strength = evaluatePasswordStrength(state.newPassword);
    const passwordValid = Object.values(strength.requirements).every(Boolean);
    const confirmPasswordValid = state.newPassword === state.confirmPassword;

    if (!passwordValid || !confirmPasswordValid) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      generalError: null,
    }));

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: state.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się zmienić hasła');
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));

      window.location.href = '/login';
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        generalError: error instanceof Error ? error.message : 'Something went wrong',
      }));
    }
  }, [state.newPassword, state.confirmPassword]);

  const togglePasswordVisibility = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }));
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showConfirmPassword: !prev.showConfirmPassword,
    }));
  }, []);

  const getPasswordStrength = useCallback(() => {
    return evaluatePasswordStrength(state.newPassword);
  }, [state.newPassword]);

  const isFormValid =
    state.newPassword.length > 0 &&
    state.confirmPassword.length > 0 &&
    !state.fieldErrors.newPassword &&
    !state.fieldErrors.confirmPassword;

  return {
    state,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleBlur,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    getPasswordStrength,
    isFormValid,
  };
}

