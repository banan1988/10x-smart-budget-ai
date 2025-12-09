import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  currentPage?: 'dashboard' | 'transactions' | 'profile';
  userEmail?: string;
  userNickname?: string;
  userRole?: 'user' | 'admin';
}

/**
 * Application header for authenticated users
 * Minimal header with logo, theme toggle and user menu
 * Navigation is handled by AppSidebar
 */
export function AppHeader({ currentPage, userEmail, userNickname, userRole = 'user' }: AppHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'user' | 'admin'>(userRole);

  // Check user role dynamically after component mounts
  // Fetch /api/user/profile on startup and cache in sessionStorage
  useEffect(() => {
    setCurrentUserRole(userRole);

    const checkUserRole = async () => {
      try {
        // Check if we have cached profile in sessionStorage first
        const cachedProfile = sessionStorage.getItem('user_profile');
        if (cachedProfile) {
          try {
            const profile = JSON.parse(cachedProfile);
            if (profile.role && profile.role !== userRole) {
              setCurrentUserRole(profile.role);
              console.log('[AppHeader] User role from cache:', profile.role);
            }
            return; // Don't fetch if we have valid cache
          } catch (e) {
            console.error('[AppHeader] Failed to parse cached profile:', e);
          }
        }

        // Fetch from API - middleware will wait up to 10s for profile
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });
        if (response.ok) {
          const profileText = await response.text();
          try {
            const profile = JSON.parse(profileText);
            // Cache the profile in sessionStorage for future use
            sessionStorage.setItem('user_profile', profileText);
            if (profile.role && profile.role !== userRole) {
              setCurrentUserRole(profile.role);
              console.log('[AppHeader] User role from API:', profile.role);
            }
          } catch (parseError) {
            console.error('[AppHeader] Failed to parse API response:', parseError);
          }
        }
      } catch (error) {
        console.error('[AppHeader] Failed to fetch user role:', error);
      }
    };

    // Fetch immediately - don't wait
    // Middleware will handle waiting for profile from database
    checkUserRole();
  }, [userRole]);

  // Get display name - prefer nickname over email prefix
  let displayName = userNickname || userEmail?.split('@')[0] || 'Użytkownik';

  // Capitalize first letter
  displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  // Add greeting prefix
  const greetingName = `Hi, ${displayName}`;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear cached profile immediately - no need to wait or check role
      sessionStorage.removeItem('user_profile');

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo - visible on mobile, hidden on desktop (sidebar has it) */}
        <div className="flex items-center gap-2 lg:hidden">
          <a href="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">💰</span>
            <span className="text-xl font-bold">SmartBudgetAI</span>
          </a>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />

          {/* Desktop user menu */}
          <div className="hidden lg:block">
            {/* User dropdown - trigger is icon + name */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-2 h-auto"
                >
                  {/* User icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>

                  {/* User name with greeting */}
                  <p className="text-sm font-medium text-foreground">{greetingName}</p>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href="/profile">Profil</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/profile/settings">Ustawienia</a>
                </DropdownMenuItem>
                {currentUserRole === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/profile/admin/stats">Panel Administratora</a>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive"
                >
                  {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href="/profile">Profil</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/profile/settings">Ustawienia</a>
                </DropdownMenuItem>
                {currentUserRole === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/profile/admin/stats">Panel Administratora</a>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive"
                >
                  {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

