/* ── Follow Along: stats count-up ── */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var statEls = document.querySelectorAll('.stat-num');
  if (!statEls.length || typeof IntersectionObserver === 'undefined') return;

  var stats = Array.prototype.map.call(statEls, function (el) {
    var raw  = el.textContent.trim();
    var match = raw.match(/^([\d.]+)(.*)$/);
    return {
      el:        el,
      target:    match ? parseFloat(match[1]) : 0,
      suffix:    match ? match[2] : '',
      isDecimal: match ? match[1].indexOf('.') !== -1 : false,
      raf:       null
    };
  });

  function fmt(val, isDecimal) {
    return isDecimal ? val.toFixed(1) : String(Math.round(val));
  }

  function startCount(stat) {
    if (stat.raf) cancelAnimationFrame(stat.raf);
    var startTime = null;
    var DURATION  = 1400;
    function step(ts) {
      if (!startTime) startTime = ts;
      var p = Math.min((ts - startTime) / DURATION, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      stat.el.textContent = fmt(stat.target * eased, stat.isDecimal) + stat.suffix;
      stat.raf = p < 1 ? requestAnimationFrame(step) : null;
    }
    stat.raf = requestAnimationFrame(step);
  }

  function resetCount(stat) {
    if (stat.raf) { cancelAnimationFrame(stat.raf); stat.raf = null; }
    stat.el.textContent = '0' + stat.suffix;
  }

  /* Set initial display to 0 */
  stats.forEach(resetCount);

  var statsCol = document.querySelector('.stats-col');
  if (!statsCol) return;

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      stats.forEach(startCount);
    } else {
      stats.forEach(resetCount);
    }
  }, { threshold: 0.4 }).observe(statsCol);
}());

/* ── Co-founder bio paragraph stagger ── */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var paras = document.querySelectorAll('.member-bio-full p');
  if (!paras.length || typeof IntersectionObserver === 'undefined') return;

  paras.forEach(function (p, i) {
    p.classList.add('bio-para-anim');
    p.classList.add(i % 2 === 0 ? 'bio-para-left' : 'bio-para-right');
  });

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle('bio-para-in', e.isIntersecting);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  paras.forEach(function (p) { obs.observe(p); });
}());

/* ── About headline self-drawing SVG (Vivus + opentype.js) ── */
/* ── Manifesto word-by-word stagger ── */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var body = document.querySelector('.manifesto-body');
  if (!body) return;

  /* Split each paragraph's text into per-word spans, preserving <em> */
  var wordCount = 0;

  function splitParagraph(p) {
    var children = Array.from(p.childNodes);
    var frag = document.createDocumentFragment();

    children.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        /* Split on whitespace, keep spaces as text nodes */
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else if (part) {
            var span = document.createElement('span');
            span.className = 'mw';
            span.style.setProperty('--wi', wordCount++);
            span.textContent = part;
            frag.appendChild(span);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'EM') {
        /* Keep <em> tag, split its words inside it */
        var em = document.createElement('em');
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (/^\s+$/.test(part)) {
            em.appendChild(document.createTextNode(part));
          } else if (part) {
            var span = document.createElement('span');
            span.className = 'mw';
            span.style.setProperty('--wi', wordCount++);
            span.textContent = part;
            em.appendChild(span);
          }
        });
        frag.appendChild(em);
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });

    while (p.firstChild) p.removeChild(p.firstChild);
    p.appendChild(frag);
  }

  body.querySelectorAll('p').forEach(splitParagraph);

  /* IntersectionObserver toggles .mf-revealed to replay on scroll-back */
  var section = document.querySelector('.manifesto');
  if (!section || typeof IntersectionObserver === 'undefined') {
    body.classList.add('mf-revealed');
    return;
  }

  var obs = new IntersectionObserver(function (entries) {
    body.classList.toggle('mf-revealed', entries[0].isIntersecting);
  }, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

  obs.observe(section);
}());


(function () {
  'use strict';

  var aboutHero = document.querySelector('.about-hero');
  var headline  = aboutHero && aboutHero.querySelector('h1');

  if (typeof opentype === 'undefined' || typeof Vivus === 'undefined') {
    if (headline) headline.style.opacity = '1';
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (headline) headline.style.opacity = '1';
    return;
  }
  if (!headline) return;

  var sectionVisible = true;
  var onEnter = null;
  var onLeave = null;

  if (typeof IntersectionObserver !== 'undefined') {
    var io = new IntersectionObserver(function (entries) {
      sectionVisible = entries[0].isIntersecting;
      if (sectionVisible) {
        if (onEnter) onEnter();
      } else {
        if (onLeave) onLeave();
      }
    }, { threshold: 0 });
    io.observe(aboutHero);
  }

  var FONT_SIZE = 76;
  var PAD      = 12;

  function fontURL(rel) {
    return rel.split('/').map(function (s) { return encodeURIComponent(s); }).join('/');
  }

  Promise.all([
    opentype.load(fontURL('Brand fonts/Perandory/Perandory-Condensed.otf')),
    opentype.load(fontURL('Brand fonts/Sloop Script Regular.ttf'))
  ]).then(function (fonts) {
    buildAndAnimate(fonts[0], fonts[1]);
  }).catch(function () {
    if (headline) { headline.style.opacity = '1'; headline.style.transform = 'none'; }
  });

  function buildAndAnimate(pFont, sFont) {
    var pScale = FONT_SIZE / pFont.unitsPerEm;

    var asc   = pFont.tables.hhea.ascender  * pScale;
    var desc  = Math.abs(pFont.tables.hhea.descender) * pScale;
    var B1    = PAD + asc;
    var B2    = B1 + (asc + desc) * 1.18;
    var SVG_H = B2 + desc + PAD;

    function glyphPaths(font, text, startX, baseline) {
      var scale  = FONT_SIZE / font.unitsPerEm;
      var glyphs = font.stringToGlyphs(text);
      var result = [];
      var x = startX;
      for (var i = 0; i < glyphs.length; i++) {
        var g  = glyphs[i];
        var gp = g.getPath(x, baseline, FONT_SIZE);
        var d  = gp.toPathData(2);
        if (d && d.replace(/[\s,MZ]/g, '').length > 0) result.push(d);
        var kern = (i < glyphs.length - 1)
          ? font.getKerningValue(g, glyphs[i + 1]) * scale : 0;
        x += g.advanceWidth * scale + kern;
      }
      return { paths: result, endX: x };
    }

    var r1  = glyphPaths(pFont, 'A small studio,', PAD, B1);
    var r2a = glyphPaths(pFont, 'shaped by ',      PAD, B2);
    var r2b = glyphPaths(sFont, 'stories.',        r2a.endX, B2);

    var W = Math.max(r1.endX, r2b.endX) + PAD;

    var NS  = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.id  = 'about-headline-svg';
    svg.setAttribute('class',       'about-svg-headline');
    svg.setAttribute('viewBox',     '0 0 ' + W.toFixed(1) + ' ' + SVG_H.toFixed(1));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable',   'false');

    function appendPaths(dArr, isAccent) {
      dArr.forEach(function (d) {
        var el = document.createElementNS(NS, 'path');
        el.setAttribute('d', d);
        el.setAttribute('class', 'letter-path' + (isAccent ? ' letter-accent' : ''));
        svg.appendChild(el);
      });
    }

    appendPaths(r1.paths,  false);
    appendPaths(r2a.paths, false);
    appendPaths(r2b.paths, true);

    headline.classList.add('about-headline-hidden');
    headline.parentNode.insertBefore(svg, headline);

    var played     = false;
    var fillDelay  = null;
    var fillTimers = [];

    var vivusInst = new Vivus(svg, {
      type:               'oneByOne',
      duration:           150,
      animTimingFunction: function (t) { return 1 - Math.pow(1 - t, 4); },
      start:              'manual'
    }, function onDone() {
      var paths = svg.querySelectorAll('.letter-path');
      fillDelay = setTimeout(function () {
        paths.forEach(function (p, i) {
          fillTimers.push(setTimeout(function () { p.classList.add('fill-done'); }, i * 12));
        });
      }, 60);
    });

    function play() {
      if (played) return;
      played = true;
      vivusInst.play();
    }

    function resetAnim() {
      clearTimeout(fillDelay);
      fillTimers.forEach(clearTimeout);
      fillDelay  = null;
      fillTimers = [];
      svg.querySelectorAll('.letter-path').forEach(function (p) { p.classList.remove('fill-done'); });
      vivusInst.stop();
      vivusInst.reset();
      played = false;
    }

    onLeave = resetAnim;
    onEnter = function () { requestAnimationFrame(play); };
    if (sectionVisible) requestAnimationFrame(play);
  }

}());
