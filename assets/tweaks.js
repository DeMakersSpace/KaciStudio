/* ═══════════════════════════════════════════════
   KACISTUDIO — Tweaks
   Scroll reveal · Marquee · Chips · Form
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initMarquee();
});

/* ── Scroll reveal (.reveal → .is-visible) ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
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
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
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
