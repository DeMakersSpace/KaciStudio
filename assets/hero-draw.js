/* ── Hero self-drawing SVG headline (Vivus + opentype.js) ── */
(function () {
  'use strict';

  var heroSection = document.getElementById('hero-split');
  var headline    = document.querySelector('.split-headline');

  /* hero-ready is pre-set in HTML for zero-lag first load; this is a safety net */
  if (heroSection) heroSection.classList.add('hero-ready');

  /* Guard: libraries must be loaded, reduced motion must be off */
  if (typeof opentype === 'undefined' || typeof Vivus === 'undefined') {
    if (headline) headline.style.opacity = '1';
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (headline) headline.style.opacity = '1';
    return;
  }

  if (!headline) return;

  /* ── IO created early so hero-ready is managed from the very first scroll
     event, not deferred until fonts finish loading.
     Vivus callbacks (onHeroEnter / onHeroLeave) are wired up later. ── */
  var heroVisible = true; /* assume visible on load */
  var onHeroEnter = null;
  var onHeroLeave = null;

  function cssPlay() {
    if (!heroSection) return;
    /* Only reflow + re-add when hero-ready was previously removed (scroll-back).
       On initial load it's already in the HTML — skipping the reflow lets
       the hsc-drop animation run uninterrupted from first paint. */
    if (!heroSection.classList.contains('hero-ready')) {
      void heroSection.offsetHeight;
      heroSection.classList.add('hero-ready');
    }
  }

  function cssReset() {
    if (heroSection) heroSection.classList.remove('hero-ready');
  }

  if (typeof IntersectionObserver !== 'undefined') {
    var io = new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) {
        cssPlay();
        if (onHeroEnter) onHeroEnter();
      } else {
        cssReset();
        if (onHeroLeave) onHeroLeave();
      }
    }, { threshold: 0 });
    io.observe(heroSection || document.body);
  }

  var FONT_SIZE = 76; /* design-space font size (SVG user units) */
  var PAD      = 12; /* breathing room around the glyph extents  */

  /* URL-encode each path segment so spaces → %20 for XHR */
  function fontURL(rel) {
    return rel.split('/').map(function (s) { return encodeURIComponent(s); }).join('/');
  }

  Promise.all([
    opentype.load(fontURL('Brand fonts/Perandory/Perandory-Condensed.otf')),
    opentype.load(fontURL('Brand fonts/Sloop Script Regular.ttf'))
  ]).then(function (fonts) {
    buildAndAnimate(fonts[0], fonts[1]);
  }).catch(function () {
    /* Font load failed — restore h1 and reveal description/button directly */
    if (headline) { headline.style.opacity = '1'; headline.style.transform = 'none'; }
    var desc = document.querySelector('#hero-split .hero-desc');
    if (desc) desc.classList.add('desc-ready');
    setTimeout(function () {
      var btns = document.querySelector('#hero-split .hero-btns');
      if (btns) btns.classList.add('btns-ready');
    }, 800);
  });

  function buildAndAnimate(pFont, sFont) {
    var pScale = FONT_SIZE / pFont.unitsPerEm;

    /* Vertical layout from Perandory's hhea metrics */
    var asc  = pFont.tables.hhea.ascender  * pScale;
    var desc = Math.abs(pFont.tables.hhea.descender) * pScale;
    var B1   = PAD + asc;
    var B2   = B1 + (asc + desc) * 1.18;
    var SVG_H = B2 + desc + PAD;

    /* Collect per-glyph SVG path data for a text run */
    function glyphPaths(font, text, startX, baseline) {
      var scale  = FONT_SIZE / font.unitsPerEm;
      var glyphs = font.stringToGlyphs(text);
      var result = [];
      var x = startX;
      for (var i = 0; i < glyphs.length; i++) {
        var g  = glyphs[i];
        var gp = g.getPath(x, baseline, FONT_SIZE);
        var d  = gp.toPathData(2);
        /* Skip spaces and other glyphs with no drawable commands */
        if (d && d.replace(/[\s,MZ]/g, '').length > 0) {
          result.push(d);
        }
        var kern = (i < glyphs.length - 1)
          ? font.getKerningValue(g, glyphs[i + 1]) * scale : 0;
        x += g.advanceWidth * scale + kern;
      }
      return { paths: result, endX: x };
    }

    var r1  = glyphPaths(pFont, 'Where your story', PAD, B1);
    var r2a = glyphPaths(pFont, 'meets ',           PAD, B2);
    var r2b = glyphPaths(sFont, 'socials.',         r2a.endX, B2);

    var W = Math.max(r1.endX, r2b.endX) + PAD;

    /* Build inline SVG */
    var NS  = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.id  = 'hero-headline-svg';
    svg.setAttribute('class',       'hero-svg-headline');
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

    /* Swap h1 for SVG — h1 stays in DOM for screen readers */
    headline.classList.add('split-headline-hidden');
    headline.parentNode.insertBefore(svg, headline);

    /* ── Timer handles for clean reset ── */
    var played     = false;
    var fillDelay  = null;
    var fillTimers = [];
    var descTimer  = null;
    var btnsTimer  = null;

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

      descTimer = setTimeout(function () {
        var d = document.querySelector('#hero-split .hero-desc');
        if (d) d.classList.add('desc-ready');
      }, 200);

      btnsTimer = setTimeout(function () {
        var b = document.querySelector('#hero-split .hero-btns');
        if (b) b.classList.add('btns-ready');
      }, 960);
    });

    function play() {
      if (played) return;
      played = true;
      vivusInst.play();
    }

    function resetVivus() {
      clearTimeout(fillDelay);
      clearTimeout(descTimer);
      clearTimeout(btnsTimer);
      fillTimers.forEach(clearTimeout);
      fillDelay  = null;
      descTimer  = null;
      btnsTimer  = null;
      fillTimers = [];

      var paths = svg.querySelectorAll('.letter-path');
      paths.forEach(function (p) { p.classList.remove('fill-done'); });

      var d = document.querySelector('#hero-split .hero-desc');
      if (d) d.classList.remove('desc-ready');

      var b = document.querySelector('#hero-split .hero-btns');
      if (b) b.classList.remove('btns-ready');

      vivusInst.stop();
      vivusInst.reset();
      played = false;
    }

    /* Wire IO callbacks now that Vivus is ready */
    onHeroLeave = resetVivus;
    onHeroEnter = function () { requestAnimationFrame(play); };

    /* If hero is already visible when fonts finished loading, start drawing */
    if (heroVisible) requestAnimationFrame(play);
  }

}());
