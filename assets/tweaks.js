/* ═══════════════════════════════════════════════
   KACISTUDIO — Tweaks
   Scroll reveal · Marquee · Chips · Form
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initScrollReveal();
  initMarquee();
});

/* ── One-shot reveal (.reveal → .is-visible, stops watching after trigger) ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal:not(.reveal-scroll)');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    { threshold: 0.05, rootMargin: '0px 0px -48px 0px' }
  );

  items.forEach(el => obs.observe(el));
}

/* ── Reversible reveal (.reveal-scroll → plays forward and reverses on scroll away) ── */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-scroll');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        e.target.classList.toggle('is-visible', e.isIntersecting);
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -48px 0px' }
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
