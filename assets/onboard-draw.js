(function () {
  'use strict';

  var section  = document.querySelector('.onboarding');
  var headline = section && section.querySelector('h2');

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
      if (sectionVisible) { if (onEnter) onEnter(); }
      else                { if (onLeave) onLeave(); }
    }, { threshold: 0 });
    io.observe(section);
  }

  var FONT_SIZE = 56;
  var PAD      = 12;

  function fontURL(rel) {
    return rel.split('/').map(function (s) { return encodeURIComponent(s); }).join('/');
  }

  Promise.all([
    opentype.load(fontURL('Brand fonts/Perandory/Perandory-Regular.otf')),
    opentype.load(fontURL('Brand fonts/Sloop Script Regular.ttf'))
  ]).then(function (fonts) {
    buildAndAnimate(fonts[0], fonts[1]);
  }).catch(function () {
    if (headline) headline.style.opacity = '1';
  });

  function buildAndAnimate(pFont, sFont) {
    var pScale = FONT_SIZE / pFont.unitsPerEm;
    var asc    = pFont.tables.hhea.ascender  * pScale;
    var desc   = Math.abs(pFont.tables.hhea.descender) * pScale;
    var B1     = PAD + asc;
    var B2     = B1 + (asc + desc) * 1.18;
    var SVG_H  = B2 + desc + PAD;

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

    var r1  = glyphPaths(pFont, 'How we work,', PAD, B1);
    var r2a = glyphPaths(pFont, 'step by ',     PAD, B2);
    var r2b = glyphPaths(sFont, 'step.',        r2a.endX, B2);

    var W = Math.max(r1.endX, r2b.endX) + PAD;

    var NS  = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.id  = 'onboard-headline-svg';
    svg.setAttribute('class',       'onboard-svg-headline');
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

    headline.classList.add('svc-headline-hidden');
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
