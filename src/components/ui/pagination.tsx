import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../lib/utils";

const Pagination = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  )
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  isDisabled?: boolean;
} & React.HTMLAttributes<HTMLAnchorElement>;

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive, isDisabled, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "border border-gray-300 bg-gray-100 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50"
          : "border border-gray-200 bg-background hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900",
        isDisabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    />
  )
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = React.forwardRef<HTMLAnchorElement, React.ComponentProps<typeof PaginationLink>>(
  ({ className, ...props }, ref) => (
    <PaginationLink ref={ref} aria-label="Go to previous page" className={cn("gap-1 pl-2.5", className)} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>Poprzednia</span>
    </PaginationLink>
  )
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = React.forwardRef<HTMLAnchorElement, React.ComponentProps<typeof PaginationLink>>(
  ({ className, ...props }, ref) => (
    <PaginationLink ref={ref} aria-label="Go to next page" className={cn("gap-1 pr-2.5", className)} {...props}>
      <span>Następna</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
);
PaginationNext.displayName = "PaginationNext";

export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious };
