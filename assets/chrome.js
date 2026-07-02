/* ═══════════════════════════════════════════════
   KACISTUDIO — Chrome (progressive enhancement)
   Nav and footer markup ships server-rendered in each
   page's HTML (see the .kaci-nav / .kaci-footer blocks).
   This file only wires up interactive behavior on top
   of that existing markup — it builds nothing from scratch.
   KaciChrome.init()
═══════════════════════════════════════════════ */

const KaciChrome = (() => {

  /* ── Availability banner ── */
  function initBanner() {
    const bannerEl = document.getElementById('kaci-banner');
    if (!bannerEl) return;

    if (sessionStorage.getItem('kaci-banner-dismissed') === '1') {
      bannerEl.style.display = 'none';
      return;
    }

    const closeBtn = bannerEl.querySelector('.kaci-banner-close');
    if (!closeBtn) return;
    closeBtn.addEventListener('click', () => {
      bannerEl.style.display = 'none';
      sessionStorage.setItem('kaci-banner-dismissed', '1');
      document.documentElement.classList.add('banner-dismissed');
    });
  }

  /* ── Mobile menu ── */
  function initMobileMenu() {
    const hamburger = document.querySelector('.kaci-nav-hamburger');
    const menu = document.getElementById('kaci-mobile-menu');
    if (!hamburger || !menu) return;
    const closeBtn = menu.querySelector('.kaci-mobile-close');

    function openMenu() {
      menu.classList.add('is-open');
      hamburger.classList.add('is-open');
      document.body.classList.add('nav-locked');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      document.body.classList.remove('nav-locked');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    hamburger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ── Footer copyright year ── */
  function initFooterYear() {
    const yearEl = document.getElementById('kaci-footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ── Nav auto-hide on scroll ──
     The pill nav is docked at the bottom of the viewport (see .kaci-nav in
     tokens.css), so on tall pages it sits on top of body copy while the
     visitor scrolls (most visible on services.html's package tiers). Hide
     it on scroll-down, reveal it on scroll-up or near the top of the page.
     Desktop/tablet only (min-width matches tokens.css's 768px breakpoint):
     on mobile the pill collapses to the hamburger, which is the only way
     to reach the rest of the nav, so it must never be hidden or made
     pointer-events:none there. */
  function initNavAutoHide() {
    const nav = document.querySelector('.kaci-nav');
    if (!nav) return;
    if (!window.matchMedia('(min-width: 769px)').matches) return;

    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < 80 || document.body.classList.contains('nav-locked')) {
        nav.classList.remove('kaci-nav-hidden');
      } else if (delta > 6) {
        nav.classList.add('kaci-nav-hidden');
      } else if (delta < -6) {
        nav.classList.remove('kaci-nav-hidden');
      }

      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function init() {
    initBanner();
    initMobileMenu();
    initFooterYear();
    initNavAutoHide();
  }

  return { init };

})();
