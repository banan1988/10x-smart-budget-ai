import { cn } from '@/lib/utils';

interface MobileNavProps {
  currentPage?: 'dashboard' | 'transactions';
}

/**
 * Mobile bottom navigation bar
 * Visible only on mobile devices (< 1024px)
 */
export function MobileNav({ currentPage }: MobileNavProps) {
  const navItems = [
    {
      name: 'Pulpit',
      href: '/dashboard',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
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
          width="24"
          height="24"
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
              item.active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.name}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

