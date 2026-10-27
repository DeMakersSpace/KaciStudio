/* Shared rotation controls: explicit pause, reduced motion, and reading time. */
function initKaciRotation(root, advance, interval, label) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'carousel-motion-control';
  button.setAttribute('aria-controls', root.id);
  root.before(button);
  let enabled = false;
  let paused = false;
  let hovered = false;
  let visible = !('IntersectionObserver' in window);
  let timer;

  function sync() {
    clearInterval(timer);
    button.textContent = reduced.matches ? 'Automatic rotation off' : paused ? 'Resume rotation' : 'Pause rotation';
    button.setAttribute('aria-label', label + ': ' + button.textContent.toLowerCase());
    button.disabled = reduced.matches;
    if (enabled && visible && !paused && !hovered && !reduced.matches && !document.hidden && !root.contains(document.activeElement)) {
      timer = setInterval(advance, interval);
    }
  }
  button.addEventListener('click', () => { paused = !paused; sync(); });
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
