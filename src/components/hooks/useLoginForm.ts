import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface LoginFormState {
  email: string;
  password: string;
  emailError?: string;
  passwordError?: string;
  generalError?: string;
  isLoading: boolean;
  isSuccess: boolean;
  touched: {
    email: boolean;
    password: boolean;
  };
}

interface UseLoginFormReturn {
  state: LoginFormState;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleBlur: (field: "email" | "password") => void;
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
    return "Email jest wymagany";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "Email jest wymagany i musi być prawidłowy";
  }
  return undefined;
}

/**
 * Validate password
 */
function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Hasło jest wymagane";
  }
  if (password.length < 6) {
    return "Hasło musi mieć co najmniej 6 znaków";
  }
  return undefined;
}

/**
 * Custom hook for managing login form state and submission
 */
export function useLoginForm(): UseLoginFormReturn {
  const [state, setState] = useState<LoginFormState>({
    email: "",
    password: "",
    isLoading: false,
    isSuccess: false,
    touched: {
      email: false,
      password: false,
    },
  });

  /**
   * Handle email change
   */
  const handleEmailChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      email: value,
      emailError: undefined,
      generalError: undefined,
      isSuccess: false,
    }));
  }, []);

  /**
   * Handle password change
   */
  const handlePasswordChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      password: value,
      passwordError: undefined,
      generalError: undefined,
      isSuccess: false,
    }));
  }, []);

  /**
   * Handle blur event for field validation
   */
  const handleBlur = useCallback((field: "email" | "password") => {
    setState((prev) => {
      const newState = { ...prev };
      newState.touched[field] = true;

      if (field === "email") {
        newState.emailError = validateEmail(prev.email);
      } else if (field === "password") {
        newState.passwordError = validatePassword(prev.password);
      }

      return newState;
    });
  }, []);

  /**
   * Submit login form
   */
  const handleSubmit = useCallback(async () => {
    // Validate all fields
    const emailError = validateEmail(state.email);
    const passwordError = validatePassword(state.password);

    // Mark all fields as touched
    setState((prev) => ({
      ...prev,
      touched: { email: true, password: true },
      emailError,
      passwordError,
    }));

    if (emailError || passwordError) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, generalError: undefined }));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific API errors based on response status
        let errorMessage = "Coś poszło nie tak. Spróbuj jeszcze raz.";
        let fieldError: "email" | "password" | "general" = "general";

        if (response.status === 401) {
          // Invalid credentials
          errorMessage = data.error || "Email lub hasło są nieprawidłowe";
          fieldError = "password";
        } else if (response.status === 403) {
          // Email not confirmed
          errorMessage = data.error || "Potwierdź swój email przed zalogowaniem";
          fieldError = "general";
        } else if (response.status === 404) {
          // User not found
          errorMessage = data.error || "Użytkownik nie istnieje";
          fieldError = "password";
        } else if (response.status === 429) {
          // Rate limited
          errorMessage = data.error || "Za wiele prób logowania. Spróbuj później.";
          fieldError = "general";
        } else if (response.status >= 500) {
          // Server error
          errorMessage = "Błąd serwera. Spróbuj później.";
          fieldError = "general";
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          ...(fieldError === "password" && { passwordError: errorMessage }),
          ...(fieldError === "general" && { generalError: errorMessage }),
          ...(fieldError === "email" && { emailError: errorMessage }),
        }));

        if (fieldError === "password") {
          setState((prev) => ({ ...prev, password: "" }));
        }

        toast.error(errorMessage);
        return;
      }

      // Success - show success message and redirect
      toast.success("Pomyślnie zalogowano");

      // Set success flag to trigger redirect
      setState((prev) => ({ ...prev, isLoading: false, isSuccess: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Błąd połączenia. Spróbuj jeszcze raz.";
      toast.error(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Login error:", error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        generalError: errorMessage,
      }));
    }
  }, [state.email, state.password]);

  // Handle redirect after successful login
  useEffect(() => {
    if (state.isSuccess) {
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isSuccess]);

  /**
   * Check if form is valid
   */
  const isFormValid = !validateEmail(state.email) && !validatePassword(state.password) && !state.isLoading;

  return {
    state,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit,
    isFormValid,
  };
}
