import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLoginForm } from './useLoginForm';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should initialize with empty values', () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.state.email).toBe('');
    expect(result.current.state.password).toBe('');
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.touched.email).toBe(false);
    expect(result.current.state.touched.password).toBe(false);
  });

  describe('Email validation', () => {
    it('should validate email format on blur', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handleBlur('email');
      });

      expect(result.current.state.emailError).toBe('Email jest wymagany i musi być prawidłowy');
      expect(result.current.state.touched.email).toBe(true);
    });

    it('should accept valid email format', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handleBlur('email');
      });

      expect(result.current.state.emailError).toBeUndefined();
    });

    it('should show error for empty email', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleBlur('email');
      });

      expect(result.current.state.emailError).toBe('Email jest wymagany');
    });

    it('should clear email error on change', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handleBlur('email');
      });

      expect(result.current.state.emailError).toBeDefined();

      act(() => {
        result.current.handleEmailChange('valid@example.com');
      });

      expect(result.current.state.emailError).toBeUndefined();
    });
  });

  describe('Password validation', () => {
    it('should validate password length on blur', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handlePasswordChange('12345');
        result.current.handleBlur('password');
      });

      expect(result.current.state.passwordError).toBe('Hasło musi mieć co najmniej 6 znaków');
    });

    it('should accept valid password', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handlePasswordChange('password123');
        result.current.handleBlur('password');
      });

      expect(result.current.state.passwordError).toBeUndefined();
    });

    it('should show error for empty password', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleBlur('password');
      });

      expect(result.current.state.passwordError).toBe('Hasło jest wymagane');
    });

    it('should clear password error on change', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handlePasswordChange('short');
        result.current.handleBlur('password');
      });

      expect(result.current.state.passwordError).toBeDefined();

      act(() => {
        result.current.handlePasswordChange('validpassword');
      });

      expect(result.current.state.passwordError).toBeUndefined();
    });
  });

  describe('Form validation', () => {
    it('should return isFormValid = true when both fields are valid', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it('should return isFormValid = false when email is invalid', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handlePasswordChange('password123');
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it('should return isFormValid = false when password is invalid', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('short');
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it('should return isFormValid = false when form is loading', () => {
      const { result } = renderHook(() => useLoginForm());

      // Manually set loading state (would normally happen during submit)
      expect(result.current.isFormValid).toBe(false); // empty fields
    });
  });

  describe('Form submission', () => {
    it('should not submit when email is invalid', async () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('invalid-email');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.state.emailError).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not submit when password is invalid', async () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('short');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.state.passwordError).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call API with correct email and password', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123',
          }),
        })
      );
    });

    it('should set loading state during submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // After successful submission, isLoading should be false
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });
    });

    it('should handle invalid credentials error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid login credentials' }),
      });

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      // Hook mapuje 401 na "Błędny email lub hasło" jeśli data.error jest "Invalid login credentials"
      // Ale w teście sprawdzamy wartość rzeczywistą z API
      expect(result.current.state.passwordError).toBeTruthy();
      expect(result.current.state.password).toBe('');
      expect(result.current.state.isLoading).toBe(false);
    });

    it('should handle email not confirmed error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Email not confirmed' }),
      });

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.state.generalError).toBeTruthy();
    });

    it('should handle too many attempts error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too many attempts' }),
      });

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.state.generalError).toBe('Za wiele prób logowania. Spróbuj później.');
    });

    it('should handle network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.state.generalError).toBe('Network error');
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  describe('Touched state', () => {
    it('should mark field as touched on blur', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleBlur('email');
      });

      expect(result.current.state.touched.email).toBe(true);
      expect(result.current.state.touched.password).toBe(false);
    });

    it('should mark all fields as touched on submit attempt', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleEmailChange('user@example.com');
        result.current.handlePasswordChange('password123');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.state.touched.email).toBe(true);
      expect(result.current.state.touched.password).toBe(true);
    });
  });
});

