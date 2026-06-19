(function () {
  'use strict';

  var hero = document.querySelector('.contact-hero');
  var headline = hero && hero.querySelector('h1');

  if (typeof opentype === 'undefined' || typeof Vivus === 'undefined') {
    if (headline) headline.style.opacity = '1';
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (headline) headline.style.opacity = '1';
    return;
  }
  if (!headline) return;

  var FONT_SIZE = 58;
  var PAD = 12;

  function fontURL(rel) {
    return rel.split('/').map(function (part) { return encodeURIComponent(part); }).join('/');
  }

  Promise.all([
    opentype.load(fontURL('Brand fonts/Perandory/Perandory-Regular.otf')),
    opentype.load(fontURL('Brand fonts/Sloop Script Regular.ttf'))
  ]).then(function (fonts) {
    buildAndAnimate(fonts[0], fonts[1]);
  }).catch(function () {
    headline.style.opacity = '1';
    headline.style.transform = 'none';
  });

  function buildAndAnimate(pFont, sFont) {
    var pScale = FONT_SIZE / pFont.unitsPerEm;
    var asc = pFont.tables.hhea.ascender * pScale;
    var desc = Math.abs(pFont.tables.hhea.descender) * pScale;
    var lineGap = (asc + desc) * 1.16;
    var baselines = [PAD + asc, PAD + asc + lineGap, PAD + asc + lineGap * 2];
    var svgH = baselines[2] + desc + PAD;

    function glyphPaths(font, text, startX, baseline) {
      var scale = FONT_SIZE / font.unitsPerEm;
      var glyphs = font.stringToGlyphs(text);
      var result = [];
      var x = startX;

      for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];
        var path = glyph.getPath(x, baseline, FONT_SIZE);
        var d = path.toPathData(2);
        if (d && d.replace(/[\s,MZ]/g, '').length > 0) result.push(d);
        var kern = (i < glyphs.length - 1)
          ? font.getKerningValue(glyph, glyphs[i + 1]) * scale
          : 0;
        x += glyph.advanceWidth * scale + kern;
      }

      return { paths: result, endX: x };
    }

    function buildRun(font, text, x, baseline, accent) {
      var run = glyphPaths(font, text, x, baseline);
      run.accent = accent;
      return run;
    }

    var line1 = [buildRun(pFont, "Let's create something", PAD, baselines[0], false)];
    var line2a = buildRun(pFont, 'your audience can ', PAD, baselines[1], false);
    var line2b = buildRun(sFont, 'feel,', line2a.endX, baselines[1], true);
    var line2 = [line2a, line2b];
    var line3 = [buildRun(pFont, 'not just scroll past.', PAD, baselines[2], false)];
    var lines = [line1, line2, line3];

    var maxW = Math.max(
      line1[line1.length - 1].endX,
      line2[line2.length - 1].endX,
      line3[line3.length - 1].endX
    ) + PAD;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.id = 'contact-headline-svg';
    svg.setAttribute('class', 'contact-svg-headline');
    svg.setAttribute('viewBox', '0 0 ' + maxW.toFixed(1) + ' ' + svgH.toFixed(1));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    function appendPaths(parent, dArr, accent) {
      dArr.forEach(function (d) {
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'letter-path' + (accent ? ' letter-accent' : ''));
        parent.appendChild(path);
      });
    }

    lines.forEach(function (line) {
      var lineW = line[line.length - 1].endX - PAD;
      var offset = (maxW - lineW) / 2 - PAD;
      var group = document.createElementNS(NS, 'g');
      group.setAttribute('transform', 'translate(' + offset.toFixed(2) + ',0)');
      line.forEach(function (run) {
        appendPaths(group, run.paths, run.accent);
      });
      svg.appendChild(group);
    });

    headline.classList.add('contact-headline-hidden');
    headline.parentNode.insertBefore(svg, headline);

    var played = false;
    var fillDelay = null;
    var fillTimers = [];

    var vivusInst = new Vivus(svg, {
      type: 'oneByOne',
      duration: 170,
      animTimingFunction: function (t) { return 1 - Math.pow(1 - t, 4); },
      start: 'manual'
    }, function onDone() {
      var paths = svg.querySelectorAll('.letter-path');
      fillDelay = setTimeout(function () {
        paths.forEach(function (path, i) {
          fillTimers.push(setTimeout(function () { path.classList.add('fill-done'); }, i * 12));
        });
      }, 60);
    });

    function play() {
      if (played) return;
      played = true;
      vivusInst.play();
    }

    if (typeof IntersectionObserver !== 'undefined') {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          requestAnimationFrame(play);
        } else {
          clearTimeout(fillDelay);
          fillTimers.forEach(clearTimeout);
          fillTimers = [];
          svg.querySelectorAll('.letter-path').forEach(function (path) {
            path.classList.remove('fill-done');
          });
          vivusInst.stop();
          vivusInst.reset();
          played = false;
        }
      }, { threshold: 0 });
      io.observe(hero);
    } else {
      requestAnimationFrame(play);
    }
  }
}());
