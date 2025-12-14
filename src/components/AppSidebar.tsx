import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  currentPage?: "dashboard" | "transactions" | "profile" | "admin-stats" | "admin-feedbacks";
  userRole?: "user" | "admin"; // Role of the current user
}

/**
 * Application sidebar with navigation for authenticated users
 * Inspired by Shadcn/ui dashboard example
 * Collapsible between icon-only and full width with labels
 */
export function AppSidebar({ currentPage, userRole = "user" }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"user" | "admin">(userRole);
  const isAdmin = currentUserRole === "admin";

  useEffect(() => {
    // Always start with collapsed sidebar on first mount
    // This ensures sidebar is hidden by default after login
    localStorage.setItem("sidebar-expanded", "false");
    setIsExpanded(false);

    // Listen for toggle events
    const handleToggle = () => {
      setIsExpanded((prev) => {
        const newState = !prev;
        localStorage.setItem("sidebar-expanded", String(newState));
        return newState;
      });
    };

    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Check user role dynamically after component mounts
  // This helps when role is loaded asynchronously in middleware
  // NOTE: For admin paths, middleware already waited for profile, so don't fetch again
  useEffect(() => {
    setCurrentUserRole(userRole);

    // Try to fetch user profile to get the actual role if it's still 'user'
    // Only fetch if we don't have a cached profile yet
    if (userRole === "user") {
      const checkUserRole = async () => {
        try {
          // Check if we have cached profile in sessionStorage
          const cachedProfile = sessionStorage.getItem("user_profile");
          if (cachedProfile) {
            try {
              const profile = JSON.parse(cachedProfile);
              if (profile.role && profile.role !== userRole) {
                setCurrentUserRole(profile.role);
                // eslint-disable-next-line no-console
                console.log("[AppSidebar] User role updated from cache:", profile.role);
              }
              return; // Don't fetch if we have valid cache
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error("[AppSidebar] Failed to parse cached profile:", e);
            }
          }

          // Fetch from API if not in cache
          const response = await fetch("/api/user/profile", {
            credentials: "include",
          });
          if (response.ok) {
            const profileText = await response.text();
            try {
              const profile = JSON.parse(profileText);
              // Cache the profile in sessionStorage for the session
              sessionStorage.setItem("user_profile", profileText);
              if (profile.role && profile.role !== userRole) {
                setCurrentUserRole(profile.role);
                // eslint-disable-next-line no-console
                console.log("[AppSidebar] User role updated from API:", profile.role);
              }
            } catch (parseError) {
              // eslint-disable-next-line no-console
              console.error("[AppSidebar] Failed to parse API response:", parseError);
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("[AppSidebar] Failed to fetch user role:", error);
        }
      };

      // Small delay to avoid race conditions with middleware
      const timer = setTimeout(checkUserRole, 150);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const navItems = [
    {
      name: "Pulpit",
      href: "/dashboard",
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
      active: currentPage === "dashboard",
    },
    {
      name: "Transakcje",
      href: "/transactions",
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
      active: currentPage === "transactions",
    },
    {
      name: "Profil",
      href: "/profile",
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
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      active: currentPage === "profile",
    },
  ];

  const adminItems = [
    {
      name: "Statystyki AI",
      href: "/profile/admin/stats",
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
          <path d="M3 3v18a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7V3" />
          <path d="M16 3H8v4h8V3z" />
          <rect x="6" y="14" width="3" height="4" />
          <rect x="13" y="11" width="3" height="7" />
        </svg>
      ),
      active: currentPage === "admin-stats",
    },
    {
      name: "Feedbacki",
      href: "/profile/admin/feedbacks",
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01" />
          <path d="M12 10h.01" />
          <path d="M16 10h.01" />
        </svg>
      ),
      active: currentPage === "admin-feedbacks",
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
            {isExpanded && <span className="text-lg font-bold">SmartBudgetAI</span>}
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-2">
          {/* Main menu section */}
          {isExpanded && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</div>
          )}
          {!isExpanded && (
            <div className="flex justify-center py-2">
              <span className="text-xs font-semibold text-muted-foreground">MENU</span>
            </div>
          )}
          <div className={cn("space-y-1", isExpanded && "ml-2 pl-2")}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
                title={item.name}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isExpanded && <span className="text-sm font-medium">{item.name}</span>}
              </a>
            ))}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="pt-2">
              {isExpanded && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Panel Administratora
                </div>
              )}
              {!isExpanded && (
                <div className="flex justify-center py-2">
                  <span className="text-xs font-semibold text-muted-foreground">ADMIN</span>
                </div>
              )}
              <div className={cn("space-y-1", isExpanded && "ml-2 pl-2")}>
                {adminItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      item.active ? "bg-blue-600 text-white" : "text-muted-foreground"
                    )}
                    title={item.name}
                  >
                    <span className={cn("flex-shrink-0", !item.active && "text-blue-500")}>{item.icon}</span>
                    {isExpanded && <span className="text-sm font-medium">{item.name}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section - Settings */}
        <div className="space-y-2 p-2">
          <a
            href="/profile/settings"
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
            {isExpanded && <span className="text-sm font-medium">Ustawienia</span>}
          </a>
        </div>
      </div>
    </aside>
  );
}
