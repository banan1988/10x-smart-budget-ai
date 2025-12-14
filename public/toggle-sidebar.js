/* global localStorage, setTimeout */
(function () {
  // Update main content padding based on sidebar state
  function updateMainContentPadding() {
    const sidebarExpanded = localStorage.getItem("sidebar-expanded") === "true";
    const mainContent = document.getElementById("main-content");
    if (mainContent && window.innerWidth >= 1024) {
      mainContent.style.paddingLeft = sidebarExpanded ? "14rem" : "4rem";
    }
  }

  // Run immediately
  updateMainContentPadding();

  // Setup event listeners
  window.addEventListener("toggle-sidebar", () => {
    setTimeout(updateMainContentPadding, 50);
  });
  window.addEventListener("resize", updateMainContentPadding);
})();
