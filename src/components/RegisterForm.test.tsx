import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from './RegisterForm';

describe('RegisterForm Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<RegisterForm />);

      expect(screen.getByText('Rejestracja')).toBeInTheDocument();
      expect(screen.getByText('Utwórz nowe konto SmartBudgetAI')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();

      // For password fields, get them by placeholder since both have "Hasło" in label
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      expect(passwordInputs).toHaveLength(2);
    });

    it('should render the submit button', () => {
      render(<RegisterForm />);

      const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should render login link', () => {
      render(<RegisterForm />);

      const loginLink = screen.getByRole('link', { name: /Zaloguj się/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should render privacy policy notice', () => {
      render(<RegisterForm />);

      expect(screen.getByText(/polityką prywatności/i)).toBeInTheDocument();
      expect(screen.getByText(/warunkami użytkowania/i)).toBeInTheDocument();
    });

    it('should render show/hide password buttons', () => {
      render(<RegisterForm />);

      const passwordButtons = screen.getAllByRole('button', { name: /hasło/i });
      expect(passwordButtons.length).toBe(2);
    });
  });

  describe('Email Field Interaction', () => {
    it('should update email input value', async () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should show error for invalid email after blur', async () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Wprowadź prawidłowy adres email/i)).toBeInTheDocument();
      });
    });

    it('should clear email error when valid email is provided', async () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Wprowadź prawidłowy adres email/i)).toBeInTheDocument();
      });

      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/Wprowadź prawidłowy adres email/i)).not.toBeInTheDocument();
      });
    });

    it('should not show email error before blur', async () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(emailInput, 'invalid-email');

      expect(screen.queryByText(/Wprowadź prawidłowy adres email/i)).not.toBeInTheDocument();
    });

    it('should set aria-invalid for invalid email', async () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;

      await userEvent.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby for error messages', async () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Password Field Interaction', () => {
    it('should update password input value', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      await userEvent.type(passwordInput, 'TestPass123!');

      expect(passwordInput).toHaveValue('TestPass123!');
    });

    it('should toggle password visibility', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0] as HTMLInputElement;
      const showButtons = screen.getAllByRole('button', { name: /hasło/i });
      const passwordShowButton = showButtons[0];

      expect(passwordInput.type).toBe('password');

      await userEvent.click(passwordShowButton);

      expect(passwordInput.type).toBe('text');

      await userEvent.click(passwordShowButton);

      expect(passwordInput.type).toBe('password');
    });

    it('should show password strength indicator when password is entered', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      await userEvent.type(passwordInput, 'Test');

      await waitFor(() => {
        expect(screen.getByText(/Siła hasła/i)).toBeInTheDocument();
      });
    });

    it('should show error for weak password after blur', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      await userEvent.type(passwordInput, 'weak');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/Hasło nie spełnia wszystkich wymagań/i)).toBeInTheDocument();
      });
    });

    it('should accept password with all requirements', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      await userEvent.type(passwordInput, 'ValidPass123!');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.queryByText(/Hasło nie spełnia wszystkich wymagań/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show all requirements in the strength indicator', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      await userEvent.type(passwordInput, 'Test');

      await waitFor(() => {
        expect(screen.getByText(/Minimum 8 znaków/i)).toBeInTheDocument();
        expect(screen.getByText(/Wielka litera/i)).toBeInTheDocument();
        expect(screen.getByText(/Mała litera/i)).toBeInTheDocument();
        expect(screen.getByText(/Cyfra/i)).toBeInTheDocument();
        expect(screen.getByText(/Znak specjalny/i)).toBeInTheDocument();
      });
    });


    it('should display weak password strength level', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];

      await userEvent.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText(/Słabe/i)).toBeInTheDocument();
      });
    });
  });

  describe('Confirm Password Field Interaction', () => {
    it('should update confirm password input value', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const confirmPasswordInput = passwordInputs[1];

      await userEvent.type(confirmPasswordInput, 'TestPass123!');

      expect(confirmPasswordInput).toHaveValue('TestPass123!');
    });

    it('should toggle confirm password visibility', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;
      const showButtons = screen.getAllByRole('button', { name: /hasło/i });
      const confirmPasswordShowButton = showButtons[1];

      expect(confirmPasswordInput.type).toBe('password');

      await userEvent.click(confirmPasswordShowButton);

      expect(confirmPasswordInput.type).toBe('text');

      await userEvent.click(confirmPasswordShowButton);

      expect(confirmPasswordInput.type).toBe('password');
    });

    it('should show error when passwords do not match', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];
      const confirmPasswordInput = passwordInputs[1];

      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.type(confirmPasswordInput, 'DifferentPass123!');
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/Hasła nie są identyczne/i)).toBeInTheDocument();
      });
    });

    it('should accept matching passwords', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      const passwordInput = passwordInputs[0];
      const confirmPasswordInput = passwordInputs[1];

      await userEvent.type(passwordInput, 'ValidPass123!');
      await userEvent.type(confirmPasswordInput, 'ValidPass123!');
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.queryByText(/Hasła nie są identyczne/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button when form is invalid', () => {
      render(<RegisterForm />);

      const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid', async () => {
      render(<RegisterForm />);

      await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await userEvent.type(passwordInputs[0], 'ValidPass123!');
      await userEvent.type(passwordInputs[1], 'ValidPass123!');

      const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Keyboard Interactions', () => {
    it('should be able to type in password fields using keyboard', async () => {
      render(<RegisterForm />);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      await userEvent.type(passwordInputs[0], 'Test123!');
      await userEvent.type(passwordInputs[1], 'Test123!');

      expect(passwordInputs[0]).toHaveValue('Test123!');
      expect(passwordInputs[1]).toHaveValue('Test123!');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      render(<RegisterForm />);

      const emailLabel = screen.getByLabelText(/Email/i);
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      expect(emailLabel).toBeInTheDocument();
      expect(passwordInputs).toHaveLength(2);
    });

    it('should have required indicators for all fields', () => {
      render(<RegisterForm />);

      const asterisks = screen.getAllByText('*');
      expect(asterisks.length).toBeGreaterThanOrEqual(3);
    });

    it('should have proper aria-live region for error messages', async () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorRegion = screen.getByText(/Wprowadź prawidłowy adres email/i).closest('[role="alert"]');
        expect(errorRegion).toBeInTheDocument();
      });
    });

    it('should have aria-label on show/hide password buttons', () => {
      render(<RegisterForm />);

      const passwordButtons = screen.getAllByRole('button', { name: /hasło/i });
      expect(passwordButtons[0]).toHaveAttribute('aria-label');
      expect(passwordButtons[1]).toHaveAttribute('aria-label');
    });
  });

  describe('Input Constraints', () => {
    it('should limit email input to 255 characters', () => {
      render(<RegisterForm />);
      const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;

      expect(emailInput.maxLength).toBe(255);
    });
  });
});

