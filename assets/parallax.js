(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var blocks = Array.from(document.querySelectorAll('.parallax-block'));
  if (!blocks.length) return;

  function tick() {
    var vh = window.innerHeight;
    blocks.forEach(function (block) {
      var rect = block.getBoundingClientRect();
      var bh = rect.height;

      /* Scale-down progress: 0 = fully visible, 1 = scrolled past */
      var ip = clamp(1 - rect.bottom / vh, 0, 1);
      var sticky = block.querySelector('.parallax-sticky');
      var dark   = block.querySelector('.parallax-dark');
      if (sticky) sticky.style.transform = 'scale(' + lerp(1, 0.88, ip) + ')';
      if (dark)   dark.style.opacity     = String(lerp(0.52, 0, ip));

      /* Text parallax + fade: 0 = above fold, 1 = below fold */
      var tp      = clamp((vh - rect.top) / (vh + bh), 0, 1);
      var y       = lerp(200, -200, tp);
      var opacity = tp < 0.2 ? tp / 0.2 : tp < 0.78 ? 1 : 1 - (tp - 0.78) / 0.22;
      var overlay = block.querySelector('.parallax-overlay');
      if (overlay) {
        overlay.style.transform = 'translateY(' + y + 'px)';
        overlay.style.opacity   = String(clamp(opacity, 0, 1));
      }
    });
  }

  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
})();
