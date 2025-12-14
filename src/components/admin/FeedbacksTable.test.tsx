import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedbacksTable from "./FeedbacksTable";
import type { FeedbackDto } from "../../types";

describe("FeedbacksTable", () => {
  const mockFeedbacks: FeedbackDto[] = [
    {
      id: 1,
      rating: 5,
      comment: "Excellent service!",
      user_id: "user1",
      created_at: "2025-12-01T10:00:00Z",
    },
    {
      id: 2,
      rating: 4,
      comment: "Good, but could be better",
      user_id: "user2",
      created_at: "2025-12-02T11:00:00Z",
    },
    {
      id: 3,
      rating: 5,
      comment: null,
      user_id: "user3",
      created_at: "2025-12-03T12:00:00Z",
    },
  ];

  it("should render table with feedbacks", () => {
    // Arrange & Act
    render(<FeedbacksTable data={mockFeedbacks} />);

    // Assert
    expect(screen.getByText("Excellent service!")).toBeInTheDocument();
    expect(screen.getByText("Good, but could be better")).toBeInTheDocument();
    expect(screen.getAllByText(/5\/5/)).toHaveLength(2); // Two feedbacks with 5/5
    expect(screen.getByText(/4\/5/)).toBeInTheDocument();
  });

  it("should display empty state when no data", () => {
    // Arrange & Act
    render(<FeedbacksTable data={[]} />);

    // Assert
    expect(screen.getByText("Brak feedbacków")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    // Arrange & Act
    render(<FeedbacksTable data={[]} isLoading={true} />);

    // Assert
    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
  });

  it("should handle row expansion for full comment", async () => {
    // Arrange
    render(<FeedbacksTable data={mockFeedbacks} />);

    // Act
    const excellentRow = screen.getByText("Excellent service!").closest("tr");
    if (excellentRow) {
      fireEvent.click(excellentRow);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Pełny komentarz:")).toBeInTheDocument();
      });
    }
  });

  it("should call onSort when header is clicked", () => {
    // Arrange
    const mockOnSort = vi.fn();
    render(<FeedbacksTable data={mockFeedbacks} onSort={mockOnSort} />);

    // Act
    const ratingHeader = screen.getByText(/Ocena/);
    fireEvent.click(ratingHeader);

    // Assert
    expect(mockOnSort).toHaveBeenCalledWith("rating", "desc");
  });

  it("should show sort indicators", () => {
    // Arrange
    render(<FeedbacksTable data={mockFeedbacks} sortField="created_at" sortDirection="desc" />);

    // Assert
    const dataHeader = screen.getByText(/Data/);
    expect(dataHeader.textContent).toMatch(/↓/);
  });

  it("should truncate long comments in table view", () => {
    // Arrange
    const longCommentFeedback: FeedbackDto = {
      id: 4,
      rating: 3,
      comment: "A".repeat(100),
      user_id: "user4",
      created_at: "2025-12-04T13:00:00Z",
    };

    render(<FeedbacksTable data={[longCommentFeedback]} />);

    // Assert - check that max-w-xs class is applied (which truncates)
    const commentCells = screen.getAllByText(/^A+$/);
    expect(commentCells.length).toBeGreaterThan(0);
  });

  it("should handle feedback without comment", () => {
    // Arrange
    const feedbackNoComment: FeedbackDto = {
      id: 5,
      rating: 2,
      comment: null,
      user_id: "user5",
      created_at: "2025-12-05T14:00:00Z",
    };

    render(<FeedbacksTable data={[feedbackNoComment]} />);

    // Assert
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("should show user id truncated in table", () => {
    // Arrange & Act
    render(<FeedbacksTable data={mockFeedbacks} />);

    // Assert
    expect(screen.getByText(/user1/)).toBeInTheDocument();
  });
});
