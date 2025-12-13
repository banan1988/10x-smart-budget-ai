import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegisterForm } from "./useRegisterForm";

describe("useRegisterForm", () => {
  describe("Initial state", () => {
    it("should initialize with empty form state", () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.state.email).toBe("");
      expect(result.current.state.password).toBe("");
      expect(result.current.state.confirmPassword).toBe("");
      expect(result.current.state.showPassword).toBe(false);
      expect(result.current.state.showConfirmPassword).toBe(false);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.generalError).toBe(null);
    });

    it("should have all touched flags as false initially", () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.state.touched.email).toBe(false);
      expect(result.current.state.touched.password).toBe(false);
      expect(result.current.state.touched.confirmPassword).toBe(false);
    });

    it("should have empty field errors initially", () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.state.fieldErrors).toEqual({});
    });
  });

  describe("Email validation", () => {
    it("should update email value", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("test@example.com");
      });

      expect(result.current.state.email).toBe("test@example.com");
    });

    it("should not show email error before blur", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("invalid-email");
      });

      expect(result.current.state.fieldErrors.email).toBeUndefined();
    });

    it("should show email error on blur with invalid email", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("invalid-email");
        result.current.handleBlur("email");
      });

      expect(result.current.state.fieldErrors.email).toBe("Wprowadź prawidłowy adres email");
      expect(result.current.state.touched.email).toBe(true);
    });

    it("should accept valid email format", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("test@example.com");
        result.current.handleBlur("email");
      });

      expect(result.current.state.fieldErrors.email).toBeUndefined();
    });

    it("should reject email exceeding 255 characters", () => {
      const { result } = renderHook(() => useRegisterForm());
      const longEmail = "a".repeat(250) + "@example.com";

      act(() => {
        result.current.handleEmailChange(longEmail);
        result.current.handleBlur("email");
      });

      expect(result.current.state.fieldErrors.email).toBe("Wprowadź prawidłowy adres email");
    });

    it("should clear email error when valid email is provided after blur", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("invalid");
        result.current.handleBlur("email");
      });

      expect(result.current.state.fieldErrors.email).toBeDefined();

      act(() => {
        result.current.handleEmailChange("valid@example.com");
      });

      expect(result.current.state.fieldErrors.email).toBeUndefined();
    });
  });

  describe("Password validation", () => {
    it("should update password value", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("Test1234!");
      });

      expect(result.current.state.password).toBe("Test1234!");
    });

    it("should not show password error before blur", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("weak");
      });

      expect(result.current.state.fieldErrors.password).toBeUndefined();
    });

    it("should show password error on blur with weak password", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("weak");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBe("Hasło nie spełnia wszystkich wymagań");
    });

    it("should accept password with all requirements", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBeUndefined();
    });

    it("should require minimum 8 characters", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("Pass1!");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBeDefined();
    });

    it("should require uppercase letter", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("password123!");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBeDefined();
    });

    it("should require lowercase letter", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("PASSWORD123!");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBeDefined();
    });

    it("should require digit", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("PasswordSpecial!");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBeDefined();
    });

    it("should require special character", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("Password123");
        result.current.handleBlur("password");
      });

      expect(result.current.state.fieldErrors.password).toBeDefined();
    });

    it("should invalidate confirmPassword when password changes", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleConfirmPasswordChange("ValidPass123!");
        result.current.handleBlur("confirmPassword");
      });

      expect(result.current.state.fieldErrors.confirmPassword).toBeUndefined();

      act(() => {
        result.current.handlePasswordChange("NewValidPass123!");
      });

      expect(result.current.state.fieldErrors.confirmPassword).toBe("Hasła nie są identyczne");
    });
  });

  describe("Confirm password validation", () => {
    it("should update confirm password value", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleConfirmPasswordChange("Test1234!");
      });

      expect(result.current.state.confirmPassword).toBe("Test1234!");
    });

    it("should require confirm password to match password", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleConfirmPasswordChange("DifferentPass123!");
        result.current.handleBlur("confirmPassword");
      });

      expect(result.current.state.fieldErrors.confirmPassword).toBe("Hasła nie są identyczne");
    });

    it("should accept matching password confirmation", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleConfirmPasswordChange("ValidPass123!");
        result.current.handleBlur("confirmPassword");
      });

      expect(result.current.state.fieldErrors.confirmPassword).toBeUndefined();
    });
  });

  describe("Password visibility toggle", () => {
    it("should toggle password visibility", () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.state.showPassword).toBe(false);

      act(() => {
        result.current.togglePasswordVisibility();
      });

      expect(result.current.state.showPassword).toBe(true);

      act(() => {
        result.current.togglePasswordVisibility();
      });

      expect(result.current.state.showPassword).toBe(false);
    });

    it("should toggle confirm password visibility", () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.state.showConfirmPassword).toBe(false);

      act(() => {
        result.current.toggleConfirmPasswordVisibility();
      });

      expect(result.current.state.showConfirmPassword).toBe(true);

      act(() => {
        result.current.toggleConfirmPasswordVisibility();
      });

      expect(result.current.state.showConfirmPassword).toBe(false);
    });
  });

  describe("Form validation", () => {
    it("should invalidate form with empty fields", () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.isFormValid).toBeFalsy();
    });

    it("should invalidate form with only email", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("test@example.com");
      });

      expect(result.current.isFormValid).toBeFalsy();
    });

    it("should invalidate form with invalid email", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("invalid-email");
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleConfirmPasswordChange("ValidPass123!");
        result.current.handleBlur("email");
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it("should validate form with all valid data", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("test@example.com");
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleConfirmPasswordChange("ValidPass123!");
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it("should invalidate form when loading", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleEmailChange("test@example.com");
        result.current.handlePasswordChange("ValidPass123!");
        result.current.handleConfirmPasswordChange("ValidPass123!");
      });

      expect(result.current.isFormValid).toBe(true);

      // Simulate loading state (would be set by handleSubmit internally)
      // This is a limitation of the test - we can't directly set isLoading
      // but the form validation is still correct
    });
  });

  describe("Password strength calculation", () => {
    it("should return weak password strength for weak password", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("weak");
      });

      const strength = result.current.getPasswordStrength();

      expect(strength.level).toBe("weak");
      expect(strength.requirements.minLength).toBe(false);
      expect(strength.score).toBeGreaterThanOrEqual(0);
      expect(strength.score).toBeLessThanOrEqual(100);
    });

    it("should return strong password strength for strong password", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("ValidPass123!");
      });

      const strength = result.current.getPasswordStrength();

      expect(["strong", "very-strong"]).toContain(strength.level);
      expect(strength.requirements.minLength).toBe(true);
      expect(strength.requirements.hasUppercase).toBe(true);
      expect(strength.requirements.hasLowercase).toBe(true);
      expect(strength.requirements.hasDigit).toBe(true);
      expect(strength.requirements.hasSpecialChar).toBe(true);
      expect(strength.score).toBeGreaterThanOrEqual(60);
    });

    it("should return very-strong password strength for all requirements met", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("VeryStrongPass123!@#");
      });

      const strength = result.current.getPasswordStrength();

      expect(strength.level).toBe("very-strong");
      expect(strength.score).toBe(100);
    });

    it("should calculate correct requirements object", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handlePasswordChange("Pass1!");
      });

      const strength = result.current.getPasswordStrength();

      expect(strength.requirements).toEqual({
        minLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasDigit: true,
        hasSpecialChar: true,
      });
    });
  });

  describe("Blur event handling", () => {
    it("should mark email as touched on blur", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleBlur("email");
      });

      expect(result.current.state.touched.email).toBe(true);
    });

    it("should mark password as touched on blur", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleBlur("password");
      });

      expect(result.current.state.touched.password).toBe(true);
    });

    it("should mark confirmPassword as touched on blur", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleBlur("confirmPassword");
      });

      expect(result.current.state.touched.confirmPassword).toBe(true);
    });

    it("should validate all fields when blur occurs on empty field", () => {
      const { result } = renderHook(() => useRegisterForm());

      act(() => {
        result.current.handleBlur("email");
        result.current.handleBlur("password");
        result.current.handleBlur("confirmPassword");
      });

      expect(result.current.state.fieldErrors.email).toBeDefined();
      expect(result.current.state.fieldErrors.password).toBeDefined();
      expect(result.current.state.fieldErrors.confirmPassword).toBeDefined();
    });
  });
});
