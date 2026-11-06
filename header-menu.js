/* Vijay Bartan Bhandar — reliable mobile navigation */
(() => {
  function initHeaderMenu() {
    const header = document.querySelector(".header");
    const button = document.getElementById("menuBtn");
    const nav = document.getElementById("mainNavigation");
    if (!header || !button || !nav || button.dataset.menuReady === "1") return;
    button.dataset.menuReady = "1";

    const closeMenu = () => {
      nav.classList.remove("active");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open Menu");
      button.innerHTML = "☰";
    };
    const openMenu = () => {
      nav.classList.add("active");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close Menu");
      button.innerHTML = "✕";
    };

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      nav.classList.contains("active") ? closeMenu() : openMenu();
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeaderMenu, { once: true });
  } else {
    initHeaderMenu();
  }
})();
