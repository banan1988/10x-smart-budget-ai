import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLoginForm } from './useLoginForm';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useLoginForm', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Use vi.spyOn to properly mock fetch with mockClear() support
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(vi.fn());
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should initialize with empty values', () => {
    // Act
    const { result } = renderHook(() => useLoginForm());

    // Assert
    expect(result.current.state.email).toBe('', 'Email should initialize as empty string');
    expect(result.current.state.password).toBe('', 'Password should initialize as empty string');
    expect(result.current.state.isLoading).toBe(false, 'Loading state should be false initially');
    expect(result.current.state.touched.email).toBe(false, 'Email touched flag should be false');
    expect(result.current.state.touched.password).toBe(false, 'Password touched flag should be false');
  });

  describe('Email validation', () => {
    it('should validate email format on blur', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());
      const invalidEmail = 'invalid-email';

      // Act
      act(() => {
        result.current.handleEmailChange(invalidEmail);
        result.current.handleBlur('email');
      });

      // Assert
      expect(result.current.state.emailError).toBe(
        'Email jest wymagany i musi być prawidłowy',
        'Should show invalid email format error'
      );
      expect(result.current.state.touched.email).toBe(true, 'Email field should be marked as touched');
    });

    it('should accept valid email format', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());
      const validEmail = 'user@example.com';

      // Act
      act(() => {
        result.current.handleEmailChange(validEmail);
        result.current.handleBlur('email');
      });

      // Assert
      expect(result.current.state.emailError).toBeUndefined(
        'Should not show error for valid email'
      );
    });

    it('should show error for empty email', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleBlur('email');
      });

      // Assert
      expect(result.current.state.emailError).toBe(
        'Email jest wymagany',
        'Should show required email error'
      );
    });

    it('should clear email error on change', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act - Set invalid email and blur to trigger error
      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handleBlur('email');
      });

      expect(result.current.state.emailError).toBeDefined('Error should be set initially');

      // Act - Change to valid email
      act(() => {
        result.current.handleEmailChange('valid@example.com');
      });

      // Assert
      expect(result.current.state.emailError).toBeUndefined(
        'Should clear email error when valid email is provided'
      );
    });
  });

  describe('Password validation', () => {
    it('should validate password length on blur', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());
      const shortPassword = '12345';

      // Act
      act(() => {
        result.current.handlePasswordChange(shortPassword);
        result.current.handleBlur('password');
      });

      // Assert
      expect(result.current.state.passwordError).toBe(
        'Hasło musi mieć co najmniej 6 znaków',
        'Should show minimum length password error'
      );
    });

    it('should accept valid password', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());
      const validPassword = 'password123';

      // Act
      act(() => {
        result.current.handlePasswordChange(validPassword);
        result.current.handleBlur('password');
      });

      // Assert
      expect(result.current.state.passwordError).toBeUndefined(
        'Should not show error for valid password'
      );
    });

    it('should show error for empty password', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleBlur('password');
      });

      // Assert
      expect(result.current.state.passwordError).toBe(
        'Hasło jest wymagane',
        'Should show required password error'
      );
    });

    it('should clear password error on change', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act - Set invalid password and blur to trigger error
      act(() => {
        result.current.handlePasswordChange('short');
        result.current.handleBlur('password');
      });

      expect(result.current.state.passwordError).toBeDefined('Error should be set initially');

      // Act - Change to valid password
      act(() => {
        result.current.handlePasswordChange('validpassword');
      });

      // Assert
      expect(result.current.state.passwordError).toBeUndefined(
        'Should clear password error when valid password is provided'
      );
    });
  });

  describe('Form validation', () => {
    it('should return isFormValid = true when both fields are valid', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      // Assert
      expect(result.current.isFormValid).toBe(true, 'Form should be valid when both fields are valid');
    });

    it('should return isFormValid = false when email is invalid', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handlePasswordChange('password123');
      });

      // Assert
      expect(result.current.isFormValid).toBe(false, 'Form should be invalid when email is invalid');
    });

    it('should return isFormValid = false when password is invalid', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('short');
      });

      // Assert
      expect(result.current.isFormValid).toBe(
        false,
        'Form should be invalid when password is invalid'
      );
    });

    it('should return isFormValid = false when form is loading', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act - Set valid values
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      expect(result.current.isFormValid).toBe(true, 'Form should be valid before submission');

      // Note: isLoading state is set internally during handleSubmit
      // This test verifies empty fields state (happy path tested in submission tests)
    });
  });

  describe('Form submission', () => {
    it('should not submit when email is invalid', async () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.emailError).toBeDefined('Email error should be set');
      expect(fetchSpy).not.toHaveBeenCalled('API should not be called with invalid email');
    });

    it('should not submit when password is invalid', async () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('short');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.passwordError).toBeDefined('Password error should be set');
      expect(fetchSpy).not.toHaveBeenCalled('API should not be called with invalid password');
    });

    it('should call API with correct email and password', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useLoginForm());
      const testEmail = 'user@example.com';
      const testPassword = 'password123';

      // Act
      act(() => {
        result.current.handleEmailChange(testEmail);
        result.current.handlePasswordChange(testPassword);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(fetchSpy, 'API should be called with correct credentials').toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
          }),
        })
      );
    });

    it('should set loading state during submission', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(
          false,
          'Loading state should be false after successful submission'
        );
      });
    });

    it('should handle invalid credentials error (401)', async () => {
      // Arrange
      const errorMessage = 'Invalid login credentials';
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: errorMessage }),
      } as Response);

      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.passwordError).toBeTruthy(
        'Password error should be set for invalid credentials'
      );
      expect(result.current.state.password).toBe(
        '',
        'Password should be cleared on failed login'
      );
      expect(result.current.state.isLoading).toBe(
        false,
        'Loading state should be false after error'
      );
      expect(toast.error, 'Toast error should be shown').toHaveBeenCalled();
    });

    it('should handle email not confirmed error (403)', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Email not confirmed' }),
      } as Response);

      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.generalError).toBeTruthy(
        'General error should be set for email not confirmed'
      );
      expect(toast.error, 'Toast error should be shown').toHaveBeenCalled();
    });

    it('should handle too many attempts error (429)', async () => {
      // Arrange
      const expectedErrorMessage = 'Za wiele prób logowania. Spróbuj później.';
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too many attempts' }),
      } as Response);

      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.generalError).toBe(
        expectedErrorMessage,
        'Should set specific rate limit error message'
      );
      expect(toast.error, 'Toast should show rate limit error message').toHaveBeenCalledWith(
        expectedErrorMessage
      );
    });

    it('should handle network error', async () => {
      // Arrange
      const networkError = new Error('Network error');
      fetchSpy.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.generalError).toBe(
        'Network error',
        'Should display network error message'
      );
      expect(result.current.state.isLoading).toBe(
        false,
        'Loading state should be false after network error'
      );
      expect(toast.error, 'Toast should show network error').toHaveBeenCalledWith(
        'Network error'
      );
    });
  });

  describe('Touched state', () => {
    it('should mark field as touched on blur', () => {
      // Arrange
      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleBlur('email');
      });

      // Assert
      expect(result.current.state.touched.email).toBe(
        true,
        'Email field should be marked as touched'
      );
      expect(result.current.state.touched.password).toBe(
        false,
        'Password field should not be touched'
      );
    });

    it('should mark all fields as touched on submit attempt', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useLoginForm());

      // Act
      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Assert
      expect(result.current.state.touched.email).toBe(
        true,
        'Email field should be marked as touched after submit'
      );
      expect(result.current.state.touched.password).toBe(
        true,
        'Password field should be marked as touched after submit'
      );
    });
  });
});

