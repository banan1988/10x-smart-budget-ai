import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileActions from "./ProfileActions";

describe("ProfileActions", () => {
  it('should render "Edytuj ustawienia" button', () => {
    // Act
    render(<ProfileActions />);

    // Assert
    const link = screen.getByRole("link", { name: /edytuj ustawienia/i });
    expect(link).toBeInTheDocument();
  });

  it("should link to /profile/settings", () => {
    // Act
    render(<ProfileActions />);

    // Assert
    const link = screen.getByRole("link", { name: /edytuj ustawienia/i });
    expect(link).toHaveAttribute("href", "/profile/settings");
  });

  it("should render button as a link element", () => {
    // Act
    const { container } = render(<ProfileActions />);

    // Assert
    const linkElement = container.querySelector('a[href="/profile/settings"]');
    expect(linkElement).toBeInTheDocument();
  });
});
