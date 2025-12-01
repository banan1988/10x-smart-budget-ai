import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileView from './ProfileView';
import type { ProfilePageVM } from '../types';

describe('ProfileView', () => {
  const mockUserProfile: ProfilePageVM = {
    email: 'test@example.com',
    nickname: 'TestUser',
    registeredAt: '2025-01-15T10:30:00.000Z',
    preferences: { theme: 'dark', language: 'pl' },
  };

  it('should render page header with title and description', () => {
    // Act
    render(<ProfileView userProfile={mockUserProfile} />);

    // Assert
    expect(screen.getByRole('heading', { name: /profil użytkownika/i })).toBeInTheDocument();
    expect(screen.getByText(/zarządzaj swoim kontem i ustawieniami/i)).toBeInTheDocument();
  });

  it('should render ProfileCard component with user data', () => {
    // Act
    render(<ProfileView userProfile={mockUserProfile} />);

    // Assert
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('should render ProfileActions component', () => {
    // Act
    render(<ProfileView userProfile={mockUserProfile} />);

    // Assert
    expect(screen.getByRole('link', { name: /edytuj ustawienia/i })).toBeInTheDocument();
  });

  it('should handle user profile with null nickname', () => {
    // Arrange
    const profileWithNullNickname: ProfilePageVM = {
      ...mockUserProfile,
      nickname: null,
    };

    // Act
    render(<ProfileView userProfile={profileWithNullNickname} />);

    // Assert
    expect(screen.getByText('Nie ustawiono')).toBeInTheDocument();
  });

  it('should have proper semantic HTML structure', () => {
    // Act
    const { container } = render(<ProfileView userProfile={mockUserProfile} />);

    // Assert
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toBe('Profil użytkownika');
  });
});

