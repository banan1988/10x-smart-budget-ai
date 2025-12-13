import { useState, useEffect } from "react";

/**
 * Custom hook to detect media query matches
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // Legacy browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}
