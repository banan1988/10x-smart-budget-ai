/* global localStorage */
(function () {
  // Initialize theme before page renders to prevent FOUC
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = localStorage.getItem("theme") || (prefersDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
})();
