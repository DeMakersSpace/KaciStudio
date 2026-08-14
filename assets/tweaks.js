/* ═══════════════════════════════════════════════
   KACISTUDIO — Tweaks
   Scroll reveal · Marquee · Chips · Form
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  /* Each init runs independently — one throwing (a browser extension
     interfering with IntersectionObserver, an unexpected DOM shape, etc.)
     must not prevent the others from running and leaving their sections
     stuck invisible. */
  [initReveal, initScrollReveal, initMarquee].forEach(fn => {
    try { fn(); } catch (err) { console.error(fn.name + ' failed:', err); }
  });
  initRevealFailsafe();
});

/* ── Failsafe: force any .reveal/.reveal-scroll element still invisible
   after 4s to show. Catches cases where the observer above never fires for
   a given element (a bug, an edge-case DOM state) — without this, content
   that fails to reveal stays permanently blank since .reveal starts at
   opacity:0 with no other visibility trigger. */
function initRevealFailsafe() {
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible), .reveal-scroll:not(.is-visible)')
      .forEach(el => el.classList.add('is-visible'));
  }, 4000);
}

/* ── Reversible reveal (.reveal → .is-visible, resets when scrolled away) ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal:not(.reveal-scroll)');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.01, rootMargin: '0px 0px -28% 0px' }
  );

  items.forEach(el => obs.observe(el));
}

/* ── Reversible reveal (.reveal-scroll → plays forward and reverses on scroll away) ── */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-scroll');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        e.target.classList.toggle('is-visible', e.isIntersecting);
      });
    },
    { threshold: 0.01, rootMargin: '0px 0px -28% 0px' }
  );

  items.forEach(el => obs.observe(el));
}

/* ── Marquee: pause on hover, respect reduced-motion ── */
function initMarquee() {
  const tracks = document.querySelectorAll('.marquee-track');
  if (!tracks.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  tracks.forEach(track => {
    const marquee = track.closest('.marquee') || track.parentElement;
    if (!marquee) return;

    marquee.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    marquee.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  });
}
