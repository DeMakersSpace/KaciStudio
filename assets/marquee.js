/* Accessible shared motion controls for the homepage marquees. */
function initKaciMarquee(viewport, track, label, speed) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controls = document.createElement('div');
  controls.className = 'marquee-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', label + ' controls');
  const previous = document.createElement('button');
  const toggle = document.createElement('button');
  const next = document.createElement('button');
  previous.textContent = 'Previous';
  next.textContent = 'Next';
  previous.setAttribute('aria-label', 'Previous ' + label);
  next.setAttribute('aria-label', 'Next ' + label);
  [previous, toggle, next].forEach(button => {
    button.type = 'button';
    button.setAttribute('aria-controls', track.id);
    controls.appendChild(button);
  });
  viewport.before(controls);
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', label + '. Use the previous and next buttons to browse.');
  let paused = false;
  let hovered = false;
  let visible = true;
  let position = 0;
  let distance = 0;
  let frame = 0;
  let lastTime = 0;
  let animated = false;
  const hasOpenLetter = () => !!track.querySelector('.love-full-wrap.is-open');

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
  function tick(time) {
    if (lastTime) position = (position + speed * Math.min(time - lastTime, 50) / 1000) % (distance || 1);
    lastTime = time;
    track.style.transform = 'translateX(' + (-position) + 'px)';
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    stop();
    const shouldAnimate = !paused && !reduced.matches && !hasOpenLetter();
    if (shouldAnimate !== animated) {
      if (shouldAnimate) {
        position = viewport.scrollLeft;
        viewport.scrollLeft = 0;
        viewport.classList.add('is-animated');
        distance = track.scrollWidth / 2;
        position %= distance || 1;
        track.style.transform = 'translateX(' + (-position) + 'px)';
      } else {
        viewport.classList.remove('is-animated');
        track.style.transform = '';
        viewport.scrollLeft = position;
      }
      animated = shouldAnimate;
    }
    toggle.textContent = reduced.matches ? 'Motion off' : hasOpenLetter() ? 'Paused' : animated ? 'Pause' : 'Resume';
    toggle.setAttribute('aria-label', reduced.matches ? label + ' motion off: reduced motion enabled' : hasOpenLetter() ? label + ' paused: close the letter to resume' : (animated ? 'Pause ' : 'Resume ') + label);
    toggle.disabled = reduced.matches || hasOpenLetter();
    if (animated && visible && !hovered && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function pause() { paused = true; sync(); }
  function browse(direction) {
    pause();
    viewport.scrollBy({ left: direction * viewport.clientWidth * 0.8, behavior: 'auto' });
  }
  previous.addEventListener('click', () => browse(-1));
  next.addEventListener('click', () => browse(1));
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  viewport.addEventListener('focusin', event => {
    pause();
    if (event.target !== viewport) (event.target.closest('.love-card, .logo-marquee-item') || event.target).scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); browse(event.key === 'ArrowLeft' ? -1 : 1);
  });
  viewport.addEventListener('touchstart', pause, { passive: true });
  viewport.addEventListener('mouseenter', () => { hovered = true; sync(); });
  viewport.addEventListener('mouseleave', () => { hovered = false; sync(); });
  viewport.addEventListener('click', event => {
    if (event.target.closest('.love-expand-btn')) { paused = true; queueMicrotask(sync); }
  });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting); sync();
  }).observe(viewport);
  function refresh() {
    if (animated) { distance = track.scrollWidth / 2; position %= distance || 1; }
    sync();
  }
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(viewport);
  sync();
  return { refresh };
}
