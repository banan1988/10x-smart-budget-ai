import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  showSidebarToggle?: boolean;
}

/**
 * Breadcrumbs component for page navigation context
 * With optional sidebar toggle button on the left
 */
export function Breadcrumbs({ items, showSidebarToggle = false }: BreadcrumbsProps) {
  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  return (
    <div className="flex items-center gap-3">
      {showSidebarToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleSidebar}
          className="hidden lg:flex"
          title="Zwiń/rozwiń menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </Button>
      )}

      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className={cn(
                index === items.length - 1 && 'text-foreground font-medium'
              )}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

