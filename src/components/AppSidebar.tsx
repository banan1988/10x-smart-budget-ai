import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  currentPage?: 'dashboard' | 'transactions';
}

/**
 * Application sidebar with navigation for authenticated users
 * Inspired by Shadcn/ui dashboard example
 * Collapsible between icon-only and full width with labels
 */
export function AppSidebar({ currentPage }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('sidebar-expanded');
    if (saved !== null) {
      setIsExpanded(saved === 'true');
    }

    // Listen for toggle events
    const handleToggle = () => {
      setIsExpanded((prev) => {
        const newState = !prev;
        localStorage.setItem('sidebar-expanded', String(newState));
        return newState;
      });
    };

    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const navItems = [
    {
      name: 'Pulpit',
      href: '/dashboard',
      icon: (
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
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      active: currentPage === 'dashboard',
    },
    {
      name: 'Transakcje',
      href: '/transactions',
      icon: (
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
          <path d="M3 6h18" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      ),
      active: currentPage === 'transactions',
    },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isExpanded ? "w-56" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b">
          <a href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            {isExpanded && (
              <span className="text-lg font-bold">SmartBudgetAI</span>
            )}
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
              title={item.name}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isExpanded && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </a>
          ))}
        </nav>

        {/* Bottom section - Settings */}
        <div className="space-y-2 border-t p-2">
          <a
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Ustawienia"
          >
            <span className="flex-shrink-0">
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
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            {isExpanded && (
              <span className="text-sm font-medium">Ustawienia</span>
            )}
          </a>
        </div>
      </div>
    </aside>
  );
}

