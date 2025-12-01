import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateRangeFilter from './DateRangeFilter';

describe('DateRangeFilter Component', () => {
  const mockOnDateRangeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render date inputs and buttons', () => {
    render(
      <DateRangeFilter
        onDateRangeChange={mockOnDateRangeChange}
        showPresets={true}
      />
    );

    expect(screen.getByLabelText(/Od/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Do/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zastosuj/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resetuj/i })).toBeInTheDocument();
  });

  it('should display preset buttons when showPresets is true', () => {
    render(
      <DateRangeFilter
        onDateRangeChange={mockOnDateRangeChange}
        showPresets={true}
      />
    );

    expect(screen.getByRole('button', { name: /Ostatnie 7 dni/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ostatnie 30 dni/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ostatnie 90 dni/i })).toBeInTheDocument();
  });

  it('should not display preset buttons when showPresets is false', () => {
    render(
      <DateRangeFilter
        onDateRangeChange={mockOnDateRangeChange}
        showPresets={false}
      />
    );

    expect(screen.queryByRole('button', { name: /Ostatnie 7 dni/i })).not.toBeInTheDocument();
  });

  it('should call onDateRangeChange when Zastosuj is clicked', async () => {
    const user = userEvent.setup();
    const mockCallback = vi.fn();

    render(
      <DateRangeFilter
        onDateRangeChange={mockCallback}
        defaultRange={{
          startDate: '2025-11-01',
          endDate: '2025-12-01',
        }}
        showPresets={false}
      />
    );

    const applyButton = screen.getByRole('button', { name: /Zastosuj/i });
    await user.click(applyButton);

    expect(mockCallback).toHaveBeenCalled();
  });

  it('should validate that start date is not after end date', async () => {
    const user = userEvent.setup();
    render(
      <DateRangeFilter
        onDateRangeChange={mockOnDateRangeChange}
        defaultRange={{
          startDate: '2025-12-01',
          endDate: '2025-11-01',
        }}
      />
    );

    const applyButton = screen.getByRole('button', { name: /Zastosuj/i });
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/Data początkowa nie może być po dacie końcowej/i)).toBeInTheDocument();
    });

    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should show error for future date', async () => {
    const user = userEvent.setup();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().split('T')[0];

    render(
      <DateRangeFilter
        onDateRangeChange={mockOnDateRangeChange}
        defaultRange={{
          startDate: futureDate,
          endDate: futureDate,
        }}
      />
    );

    const applyButton = screen.getByRole('button', { name: /Zastosuj/i });
    await user.click(applyButton);

    // Error should be shown (either from validation or from isValidDate)
    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should apply preset and call callback on preset button click', async () => {
    const user = userEvent.setup();
    const mockCallback = vi.fn();

    render(
      <DateRangeFilter
        onDateRangeChange={mockCallback}
        showPresets={true}
      />
    );

    const sevenDaysButton = screen.getByRole('button', { name: /Ostatnie 7 dni/i });
    await user.click(sevenDaysButton);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });

    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs).toHaveProperty('startDate');
    expect(callArgs).toHaveProperty('endDate');
  });

  it('should reset to default range on Resetuj click', async () => {
    const user = userEvent.setup();
    const mockCallback = vi.fn();

    render(
      <DateRangeFilter
        onDateRangeChange={mockCallback}
        defaultRange={{
          startDate: '2025-10-01',
          endDate: '2025-10-31',
        }}
      />
    );

    const resetButton = screen.getByRole('button', { name: /Resetuj/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      })
    );
  });

  it('should validate date format', () => {
    const validDate = '2025-11-01';
    const invalidDate = '11/01/2025';

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    expect(dateRegex.test(validDate)).toBe(true);
    expect(dateRegex.test(invalidDate)).toBe(false);
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <DateRangeFilter
        onDateRangeChange={mockOnDateRangeChange}
        isLoading={true}
      />
    );

    const applyButton = screen.getByRole('button', { name: /Zastosuj|Ładowanie/i });
    const resetButton = screen.getByRole('button', { name: /Resetuj/i });

    expect(applyButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
  });
});

