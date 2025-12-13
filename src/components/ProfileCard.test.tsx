import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileCard from "./ProfileCard";

describe("ProfileCard", () => {
  it("should render profile information correctly", () => {
    // Arrange
    const mockData = {
      email: "test@example.com",
      nickname: "TestUser",
      registeredAt: "2025-01-15T10:30:00.000Z",
    };

    // Act
    render(<ProfileCard {...mockData} />);

    // Assert
    expect(screen.getByText("Informacje o profilu")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("TestUser")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Nazwa użytkownika")).toBeInTheDocument();
    expect(screen.getByText("Data rejestracji")).toBeInTheDocument();
  });

  it('should display "Nie ustawiono" when nickname is null', () => {
    // Arrange
    const mockData = {
      email: "test@example.com",
      nickname: null,
      registeredAt: "2025-01-15T10:30:00.000Z",
    };

    // Act
    render(<ProfileCard {...mockData} />);

    // Assert
    expect(screen.getByText("Nie ustawiono")).toBeInTheDocument();
  });

  it("should format registration date in Polish locale", () => {
    // Arrange
    const mockData = {
      email: "test@example.com",
      nickname: "TestUser",
      registeredAt: "2025-01-15T10:30:00.000Z",
    };

    // Act
    render(<ProfileCard {...mockData} />);

    // Assert
    // Date should be formatted as "15 stycznia 2025" in Polish locale
    expect(screen.getByText(/stycznia 2025/i)).toBeInTheDocument();
  });

  it("should render all required fields", () => {
    // Arrange
    const mockData = {
      email: "user@test.pl",
      nickname: "Budżetowy Mistrz",
      registeredAt: "2024-12-01T08:00:00.000Z",
    };

    // Act
    const { container } = render(<ProfileCard {...mockData} />);

    // Assert
    const dtElements = container.querySelectorAll("dt");
    expect(dtElements).toHaveLength(3);

    const ddElements = container.querySelectorAll("dd");
    expect(ddElements).toHaveLength(3);
  });
});
