import { useState, useCallback } from 'react';

interface FormState {
  email: string;
  isLoading: boolean;
  isSubmitted: boolean;
  generalError: string | null;
  touched: {
    email: boolean;
  };
  fieldErrors: {
    email?: string;
  };
}

interface UseForgotPasswordFormReturn {
  state: FormState;
  handleEmailChange: (value: string) => void;
  handleBlur: (field: 'email') => void;
  handleSubmit: () => Promise<void>;
  isFormValid: boolean;
}

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
function validateEmail(email: string): string | undefined {
  if (!email) {
    return 'Email jest wymagany';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Wprowadź prawidłowy adres email';
  }
  return undefined;
}

/**
 * Custom hook for managing forgot password form state and submission
 */
export function useForgotPasswordForm(): UseForgotPasswordFormReturn {
  const [state, setState] = useState<FormState>({
    email: '',
    isLoading: false,
    isSubmitted: false,
    generalError: null,
    touched: {
      email: false,
    },
    fieldErrors: {},
  });

  /**
   * Handle email change
   */
  const handleEmailChange = useCallback((value: string) => {
    setState((prev) => {
      const newState = { ...prev, email: value };

      if (prev.touched.email) {
        const error = validateEmail(value);
        if (error) {
          newState.fieldErrors = { ...prev.fieldErrors, email: error };
        } else {
          const { email: _, ...rest } = prev.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      return newState;
    });
  }, []);

  /**
   * Handle blur event for field validation
   */
  const handleBlur = useCallback((field: 'email') => {
    setState((prev) => {
      const newState = { ...prev, touched: { ...prev.touched, [field]: true } };

      if (field === 'email') {
        const error = validateEmail(prev.email);
        if (error) {
          newState.fieldErrors = { ...prev.fieldErrors, email: error };
        } else {
          const { email: _, ...rest } = prev.fieldErrors;
          newState.fieldErrors = rest;
        }
      }

      return newState;
    });
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      touched: { email: true },
    }));

    const emailError = validateEmail(state.email);

    if (emailError) {
      setState((prev) => ({
        ...prev,
        fieldErrors: { email: emailError },
        generalError: 'Popraw błędy w formularzu',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      generalError: null,
    }));

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się wysłać instrukcji resetowania hasła');
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSubmitted: true,
        generalError: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        generalError: error instanceof Error ? error.message : 'Something went wrong',
      }));
    }
  }, [state.email]);

  const isFormValid = !state.fieldErrors.email && state.email.length > 0;

  return {
    state,
    handleEmailChange,
    handleBlur,
    handleSubmit,
    isFormValid,
  };
}

