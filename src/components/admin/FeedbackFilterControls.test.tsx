import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedbackFilterControls from "./FeedbackFilterControls";

describe("FeedbackFilterControls", () => {
  it("should render filter controls", () => {
    // Arrange
    const mockOnChange = vi.fn();

    // Act
    render(<FeedbackFilterControls onFilterChange={mockOnChange} />);

    // Assert
    expect(screen.getByText("Filtry")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zastosuj" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wyczyść" })).toBeInTheDocument();
  });

  it("should call onFilterChange when Apply is clicked", async () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<FeedbackFilterControls onFilterChange={mockOnChange} />);

    const applyButton = screen.getByRole("button", { name: "Zastosuj" });

    // Act
    fireEvent.click(applyButton);

    // Assert
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it("should clear filters when Clear is clicked", async () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<FeedbackFilterControls onFilterChange={mockOnChange} />);

    const clearButton = screen.getByRole("button", { name: "Wyczyść" });

    // Act
    fireEvent.click(clearButton);

    // Assert
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({});
    });
  });

  it("should disable buttons when loading", () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<FeedbackFilterControls onFilterChange={mockOnChange} isLoading={true} />);

    const applyButton = screen.getByRole("button", { name: "Zastosuj" });
    const clearButton = screen.getByRole("button", { name: "Wyczyść" });

    // Assert
    expect(applyButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it("should have All Ratings option", () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<FeedbackFilterControls onFilterChange={mockOnChange} />);

    // Assert
    expect(screen.getByText("Wszystkie oceny")).toBeInTheDocument();
  });
});
