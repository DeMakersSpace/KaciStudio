/* Shared rotation timing: reduced motion, hover, focus, and visibility. */
function initKaciRotation(root, advance, interval) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = false;
  let hovered = false;
  let visible = !('IntersectionObserver' in window);
  let timer;

  function sync() {
    clearInterval(timer);
    if (enabled && visible && !hovered && !reduced.matches && !document.hidden && !root.contains(document.activeElement)) {
      timer = setInterval(advance, interval);
    }
  }
  root.addEventListener('mouseenter', () => { hovered = true; sync(); });
  root.addEventListener('mouseleave', () => { hovered = false; sync(); });
  root.addEventListener('focusin', sync);
  root.addEventListener('focusout', () => queueMicrotask(sync));
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    sync();
  }).observe(root);
  sync();
  return {
    start() { enabled = true; sync(); },
    stop() { enabled = false; sync(); },
  };
}
