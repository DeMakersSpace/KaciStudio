(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionObserver = null;

  function addMotion(el, variant, delay, drawLine) {
    if (!el) return;
    el.classList.add('work-motion');
    if (variant) el.classList.add(variant);
    if (drawLine) el.classList.add('work-motion-line');
    el.style.setProperty('--motion-delay', (delay || 0) + 'ms');
  }

  function revealMotion(el) {
    if (el) el.classList.add('work-motion-in');
  }

  function observeMotion(el) {
    if (!el) return;
    if (reduceMotion || !motionObserver) {
      revealMotion(el);
      return;
    }
    motionObserver.observe(el);
  }

  var caseEl = document.querySelector('.case');
  if (caseEl) {
    addMotion(caseEl.querySelector('.case-video-wrap'), 'motion-film', 0);
    addMotion(caseEl.querySelector('.case-info .eyebrow'), 'motion-left', 90);
    addMotion(caseEl.querySelector('.case-info h1'), 'motion-right', 160);
    addMotion(caseEl.querySelector('.case-pkg-label'), 'motion-chip', 205);
    caseEl.querySelectorAll('.case-chip').forEach(function (chip, i) {
      addMotion(chip, 'motion-chip', 230 + i * 42);
    });
    addMotion(caseEl.querySelector('.case-deck'), 'motion-rise', 260);
    caseEl.querySelectorAll('.case-stat').forEach(function (stat, i) {
      addMotion(stat, 'motion-stat', 350 + i * 80);
    });
    addMotion(caseEl.querySelector('.case-follow'), 'motion-follow', 420);
    caseEl.querySelectorAll('.case-expand-section').forEach(function (section, i) {
      addMotion(section, 'motion-detail', 500 + i * 95, true);
    });
  }

  if (!reduceMotion && typeof IntersectionObserver !== 'undefined') {
    motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealMotion(entry.target);
        motionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  }

  document.querySelectorAll('.work-motion').forEach(observeMotion);

  /* Video strip navigation (prev/next arrows + dots), same behaviour as work.html */
  document.querySelectorAll('.case-strip').forEach(function (strip) {
    var vids = strip.querySelectorAll('video');
    if (vids.length < 2) return;

    var wrap = strip.closest('.case-video-wrap');
    var vidIdx = 0;

    var prev = document.createElement('button');
    prev.className = 'vid-nav vid-nav-prev';
    prev.setAttribute('aria-label', 'Previous video');
    prev.textContent = '‹';

    var next = document.createElement('button');
    next.className = 'vid-nav vid-nav-next';
    next.setAttribute('aria-label', 'Next video');
    next.textContent = '›';

    var dotsEl = document.createElement('div');
    dotsEl.className = 'vid-dots';
    vids.forEach(function (_, i) {
      var d = document.createElement('span');
      d.className = 'vid-dot' + (i === 0 ? ' active' : '');
      dotsEl.appendChild(d);
    });

    wrap.appendChild(prev);
    wrap.appendChild(next);
    wrap.appendChild(dotsEl);

    function sync() {
      prev.style.opacity = vidIdx === 0 ? '0' : '';
      prev.style.pointerEvents = vidIdx === 0 ? 'none' : '';
      next.style.opacity = vidIdx === vids.length - 1 ? '0' : '';
      next.style.pointerEvents = vidIdx === vids.length - 1 ? 'none' : '';
      dotsEl.querySelectorAll('.vid-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === vidIdx);
      });
    }

    function pauseOthers(activeIdx) {
      vids.forEach(function (v, i) {
        if (i !== activeIdx) { v.pause(); v.currentTime = 0; }
      });
    }

    function vidGoTo(i) {
      vidIdx = Math.max(0, Math.min(i, vids.length - 1));
      pauseOthers(vidIdx);
      strip.scrollTo({ left: strip.offsetWidth * vidIdx, behavior: 'smooth' });
      sync();
    }

    prev.addEventListener('click', function () { vidGoTo(vidIdx - 1); });
    next.addEventListener('click', function () { vidGoTo(vidIdx + 1); });

    strip.addEventListener('scroll', function () {
      var newIdx = Math.round(strip.scrollLeft / strip.offsetWidth);
      if (newIdx !== vidIdx) {
        vidIdx = newIdx;
        pauseOthers(vidIdx);
        sync();
      }
    }, { passive: true });

    sync();
  });
})();
