/* ═══════════════════════════════════════════════
   GLOBAL JS — De Makers Space
   Mobile menu, scroll reveal, active nav link
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollReveal();
  setActiveNavLink();
});

/* ── Generic smooth accordion ──
   containerSel — wrapping element (items live inside)
   triggerSel   — the <button> that toggles            */
function initAccordion(containerSel, triggerSel) {
  const containers = document.querySelectorAll(containerSel);
  containers.forEach(container => {
    const triggers = container.querySelectorAll(triggerSel);
    triggers.forEach(trigger => {
      const panel = trigger.nextElementSibling;
      if (!panel) return;
      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        triggers.forEach(t => {
          if (t === trigger) return;
          const p = t.nextElementSibling;
          if (!p) return;
          t.setAttribute('aria-expanded', 'false');
          p.classList.remove('is-open');
        });
        trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        panel.classList.toggle('is-open', !isOpen);
      });
    });
  });
}

/* ── Shared easing ── */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

/* ── Section number count-up (.wwb-num, .sac-num) ── */
function initNumberCounters() {
  const els = document.querySelectorAll('.wwb-num, .sac-num');
  if (!els.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el       = entry.target;
      const target   = parseInt(el.textContent, 10);
      const duration = 600 + target * 40;
      const start    = performance.now();
      el.classList.add('is-counting');
      requestAnimationFrame(function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value    = Math.round(easeOutCubic(progress) * target);
        el.textContent = String(value).padStart(2, '0');
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.classList.remove('is-counting');
          el.classList.add('is-done');
        }
      });
    });
  }, { threshold: 0.6 });

  els.forEach(el => observer.observe(el));
}

/* ── Pricing count-up (.pricing-number) ── */
function initPriceCounters() {
  const els = document.querySelectorAll('.pricing-number');
  if (!els.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el     = entry.target;
      const target = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10);
      const start  = performance.now();
      el.classList.add('is-counting');
      requestAnimationFrame(function step(now) {
        const progress = Math.min((now - start) / 900, 1);
        const value    = Math.round(easeOutCubic(progress) * target);
        el.textContent = '$' + value.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = '$' + target.toLocaleString();
          el.classList.remove('is-counting');
          el.classList.add('is-done');
        }
      });
    });
  }, { threshold: 0.3 });

  els.forEach(el => observer.observe(el));
}

/* ── Mobile menu ── */
function initMobileMenu() {
  const hamburger = document.querySelector('.pill-nav-hamburger');
  const menu      = document.querySelector('.mobile-menu');
  const closeBtn  = document.querySelector('.mobile-menu-close');

  if (!hamburger || !menu) return;

  hamburger.addEventListener('click', () => {
    menu.classList.add('open');
    document.body.classList.add('nav-locked');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  menu.addEventListener('click', (e) => {
    if (e.target === menu) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  function closeMenu() {
    menu.classList.remove('open');
    document.body.classList.remove('nav-locked');
  }
}

/* ── Scroll reveal ── */
function initScrollReveal() {
  const items = document.querySelectorAll('.scroll-reveal-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

/* ── Active nav link ── */
function setActiveNavLink() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const filename = path.split('/').pop() || 'index.html';

  document.querySelectorAll('.pill-nav-link, .mobile-menu-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkFile = href.split('/').pop() || 'index.html';

    if (linkFile === filename ||
        (filename === '' && (linkFile === 'index.html' || linkFile === '')) ||
        href === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
