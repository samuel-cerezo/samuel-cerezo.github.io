document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".site-nav-toggle");
  const navLinks = document.querySelector(".site-nav-links");

  if (navToggle && navLinks) {
    const closeNavigation = () => {
      navToggle.classList.remove("is-active");
      navLinks.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.classList.toggle("is-active", !isOpen);
      navLinks.classList.toggle("is-active", !isOpen);
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNavigation);
    });
  }

  document.querySelectorAll(".publication-mousecell").forEach((container) => {
    const video = container.querySelector("video.publication-preview");
    if (!video) return;

    const playPreview = () => {
      video.play().catch(() => {});
    };
    const stopPreview = () => {
      video.pause();
      if (video.readyState > 0) video.currentTime = 0;
    };

    container.addEventListener("pointerenter", playPreview);
    container.addEventListener("pointerleave", stopPreview);
    container.addEventListener("focusin", playPreview);
    container.addEventListener("focusout", stopPreview);
  });
});
