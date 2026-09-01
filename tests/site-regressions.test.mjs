import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test, { after, before } from 'node:test';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, '_site');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 568 },
];

const HERO_MARQUEE_VIEWPORTS = [
  VIEWPORTS[0],
  { name: 'reported-desktop', width: 1863, height: 937 },
  { name: 'wide-tall-desktop', width: 2560, height: 1440 },
];

const SITE_ROUTES = [
  '/',
  '/about',
  '/services',
  '/work',
  '/contact',
  '/privacy-policy',
  '/404',
  '/case-brixx-derma',
  '/case-coffeeman-nyp',
  '/case-fino',
  '/case-flyco',
  '/case-happy-rei',
  '/case-luminance-learning',
  '/case-melissa-shoes',
  '/case-resurrack-littlemissmarket',
];

let server;
let browser;

function localChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.platform !== 'win32') return undefined;

  const candidates = [
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
    process.env.LOCALAPPDATA,
  ].filter(Boolean).map(base => path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));

  return candidates.find(existsSync);
}

function rgbChannels(value) {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  assert.equal(channels?.length, 3, `Could not parse colour: ${value}`);
  return channels;
}

function relativeLuminance(value) {
  const [red, green, blue] = rgbChannels(value).map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for the local site server');
}

async function makePage(viewport = VIEWPORTS[0], { reducedMotion = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{
    name: 'prefers-reduced-motion',
    value: reducedMotion ? 'reduce' : 'no-preference',
  }]);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const isLocal = url.hostname === '127.0.0.1';
    const isHeavyAsset = ['image', 'media', 'font'].includes(request.resourceType());
    if (!isLocal || isHeavyAsset) request.abort();
    else request.continue();
  });
  return page;
}

async function open(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
}

async function duplicateIds(page) {
  return page.$$eval('[id]', elements => {
    const counts = new Map();
    elements.forEach(element => counts.set(element.id, (counts.get(element.id) || 0) + 1));
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
}

function rectanglesOverlap(first, second) {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top;
}

async function generatedFiles() {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) files.push(path.relative(OUTPUT, absolute).replaceAll('\\', '/'));
    }
  }
  await visit(OUTPUT);
  return files;
}

before(async () => {
  server = spawn(process.execPath, ['serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), SITE_ROOT: OUTPUT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
  const executablePath = localChromePath();
  browser = await puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill();
});

test('production artifact is an allow-listed public surface', async () => {
  const files = await generatedFiles();
  const lowerFiles = new Set(files.map(file => file.toLowerCase()));
  const forbidden = [
    'package.json',
    'package-lock.json',
    'readme.md',
    'handoff.md',
    'handsoff.md',
    'website discovery guide.docx',
    '.impeccable.md',
    'serve.mjs',
    'build-site.mjs',
    'colour-reference.html',
    'tests/site-regressions.test.mjs',
  ];

  forbidden.forEach(file => assert.equal(lowerFiles.has(file), false, `${file} entered _site`));
  assert.ok(lowerFiles.has('index.html'));
  assert.ok(lowerFiles.has('_headers'));
  assert.equal(files.some(file => /\.(?:docx|md|mjs|otf|ps1|cmd)$/i.test(file)), false);

  const headers = await readFile(path.join(OUTPUT, '_headers'), 'utf8');
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /Strict-Transport-Security: max-age=31536000/);
  assert.match(headers, /\/assets\/\*\s+Cache-Control: public, max-age=0, must-revalidate/);

  for (const route of [
    '/package.json',
    '/Website%20Discovery%20Guide.docx',
    '/tests/site-regressions.test.mjs',
    '/serve.mjs',
    '/.impeccable.md',
    '/colour-reference.html',
  ]) {
    const response = await fetch(`${BASE_URL}${route}`);
    assert.equal(response.status, 404, `${route} returned ${response.status}`);
  }
});

test('every page uses progressive enhancement and only critical font preloads', async () => {
  for (const route of SITE_ROUTES) {
    const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    const source = await readFile(path.join(ROOT, filename), 'utf8');
    assert.match(source, /document\.documentElement\.classList\.add\('js'\)/, `${filename} lacks the early js marker`);
    assert.match(source, /assets\/analytics\.js/, `${filename} lacks the shared analytics loader`);
    assert.match(source, /assets\/tokens\.css\?v=\d{8}-\d+/, `${filename} does not cache-bust the shared stylesheet`);
    assert.match(source, /assets\/chrome\.js\?v=\d{8}-\d+/, `${filename} does not cache-bust the shared navigation script`);
    assert.doesNotMatch(source, /googletagmanager\.com\/gtag\/js/, `${filename} eagerly loads analytics`);
    assert.equal((source.match(/rel="preload"[^>]+as="font"/g) || []).length, 2, `${filename} preloads more than two fonts`);
  }
});

test('core content remains readable when JavaScript is disabled', async () => {
  const page = await makePage(VIEWPORTS[1]);
  await page.setJavaScriptEnabled(false);

  async function visibleCount(selector) {
    return page.$$eval(selector, elements => elements.filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && parseFloat(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0;
    }).length);
  }

  try {
    await open(page, '/about');
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('js')), false);
    assert.ok(await visibleCount('.team-head > p') >= 1);
    assert.ok(await visibleCount('.founder-tag') >= 2);

    await open(page, '/services');
    assert.ok(await visibleCount('.svc-pkg-panel') >= 3);
    assert.ok(await visibleCount('.onboard-card') >= 5);
    assert.ok(await visibleCount('.studio-faq-q') >= 5);
    assert.ok(await visibleCount('.studio-faq-wrap') >= 5);

    await open(page, '/work');
    assert.equal(await visibleCount('.case'), 8);
  } finally {
    await page.close();
  }
});

test('every server-rendered mobile menu starts hidden and inert', async () => {
  for (const route of SITE_ROUTES) {
    const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    const source = await readFile(path.join(ROOT, filename), 'utf8');
    const menuTag = source.match(/<div class="kaci-mobile-menu"[^>]*>/)?.[0] || '';
    assert.match(menuTag, /\shidden(?:\s|>)/, `${filename} menu is not initially hidden`);
    assert.match(menuTag, /\sinert(?:\s|>)/, `${filename} menu is not initially inert`);
    assert.match(menuTag, /aria-hidden="true"/, `${filename} menu is exposed to assistive technology`);
  }
});

test('every rendered page starts with unique IDs', async () => {
  const page = await makePage();
  try {
    for (const route of SITE_ROUTES) {
      await open(page, route);
      assert.deepEqual(await duplicateIds(page), [], `${route} contains duplicate IDs`);
    }
  } finally {
    await page.close();
  }
});

test('testimonial clones are inaccessible, ID-free, and labels reflect expansion', async () => {
  const page = await makePage();
  try {
    await open(page, '/');
    await page.$eval('.love-marquee', element => element.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelectorAll('#loveTrack .love-card').length === 14);

    assert.deepEqual(await duplicateIds(page), []);
    const cloneProblems = await page.$$eval('[data-carousel-clone]', clones => clones.flatMap(clone => {
      const problems = [];
      if (clone.getAttribute('aria-hidden') !== 'true') problems.push('clone is exposed');
      if (clone.querySelector('[id]')) problems.push('clone contains an ID');
      clone.querySelectorAll('a, button, input, select, textarea').forEach(control => {
        if (control.getAttribute('tabindex') !== '-1' || control.getAttribute('aria-hidden') !== 'true') {
          problems.push('clone contains an exposed control');
        }
        if (control.hasAttribute('aria-controls')) problems.push('clone control references a panel');
      });
      return problems;
    }));
    assert.deepEqual(cloneProblems, []);

    await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.click());
    assert.equal(
      await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.textContent.trim()),
      'Read less ↑',
    );
    await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.click());
    assert.equal(
      await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.textContent.trim()),
      'Read full letter ↓',
    );
  } finally {
    await page.close();
  }
});

test('testimonial expansion control meets the touch target minimum', async () => {
  const page = await makePage(VIEWPORTS[1]);
  try {
    await open(page, '/');
    const size = await page.$eval('.love-expand-btn', button => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    assert.ok(size.height >= 44, `testimonial control is only ${size.height}px high`);
  } finally {
    await page.close();
  }
});

test('video carousel endpoints are disabled and usable controls reveal on focus', async () => {
  const page = await makePage(VIEWPORTS[0]);
  try {
    await open(page, '/case-melissa-shoes');
    await page.waitForSelector('.vid-nav-next');

    const initial = await page.evaluate(() => ({
      previousDisabled: document.querySelector('.vid-nav-prev').disabled,
      previousAriaDisabled: document.querySelector('.vid-nav-prev').getAttribute('aria-disabled'),
      nextDisabled: document.querySelector('.vid-nav-next').disabled,
    }));
    assert.deepEqual(initial, {
      previousDisabled: true,
      previousAriaDisabled: 'true',
      nextDisabled: false,
    });

    await page.$eval('.vid-nav-next', button => button.click());
    await page.waitForFunction(() => document.querySelector('.vid-nav-next')?.disabled);
    const final = await page.evaluate(() => ({
      previousDisabled: document.querySelector('.vid-nav-prev').disabled,
      nextDisabled: document.querySelector('.vid-nav-next').disabled,
      nextAriaDisabled: document.querySelector('.vid-nav-next').getAttribute('aria-disabled'),
    }));
    assert.deepEqual(final, {
      previousDisabled: false,
      nextDisabled: true,
      nextAriaDisabled: 'true',
    });

    await page.focus('.vid-nav-prev');
    await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.vid-nav-prev')).opacity) > 0.9);
    const focused = await page.$eval('.vid-nav-prev', button => ({
      active: document.activeElement === button,
      disabled: button.disabled,
      display: getComputedStyle(button).display,
      opacity: parseFloat(getComputedStyle(button).opacity),
    }));
    assert.equal(focused.active, true);
    assert.equal(focused.disabled, false);
    assert.equal(focused.display, 'flex');
    assert.ok(focused.opacity > 0.9);
  } finally {
    await page.close();
  }
});

test('homepage result metrics use the readable Gordita accent treatment', async () => {
  const page = await makePage();
  try {
    await open(page, '/');
    const metrics = await page.$$eval('.result-card .stat-num', elements => elements.map(element => {
      const style = getComputedStyle(element);
      return {
        text: element.textContent.trim(),
        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        fontWeight: parseInt(style.fontWeight, 10),
        color: style.color,
      };
    }));

    assert.deepEqual(metrics.map(metric => metric.text), ['+1,700%', '900%+', '92%']);
    metrics.forEach(metric => {
      assert.match(metric.fontFamily, /Gordita/i);
      assert.ok(metric.fontSize >= 32 && metric.fontSize <= 44, `${metric.text} renders at ${metric.fontSize}px`);
      assert.equal(metric.fontWeight, 400);
      assert.equal(metric.color, 'rgb(82, 104, 143)');
    });
  } finally {
    await page.close();
  }
});

test('semantic accent roles meet text and control contrast thresholds', async () => {
  const page = await makePage();
  const readColourPair = async (route, selector) => {
    await open(page, route);
    return page.$eval(selector, element => {
      const opaqueBackground = start => {
        let node = start;
        while (node) {
          const colour = getComputedStyle(node).backgroundColor;
          if (colour && colour !== 'rgba(0, 0, 0, 0)' && colour !== 'transparent') return colour;
          node = node.parentElement;
        }
        return 'rgb(255, 255, 255)';
      };
      const style = getComputedStyle(element);
      return {
        text: style.color,
        background: opaqueBackground(element),
        border: style.borderTopColor,
        ambient: opaqueBackground(element.parentElement),
      };
    });
  };

  try {
    const metric = await readColourPair('/', '.result-card .stat-num');
    assert.ok(contrastRatio(metric.text, metric.background) >= 4.5);

    const primary = await readColourPair('/', '.hero-btns .btn-primary');
    assert.ok(contrastRatio(primary.text, primary.background) >= 4.5);
    assert.ok(contrastRatio(primary.border, primary.ambient) >= 3);

    const navCta = await readColourPair('/', '.kaci-nav-cta');
    assert.ok(contrastRatio(navCta.text, navCta.background) >= 4.5);

    const darkAccentCopy = await readColourPair('/services', '.svc-cats h1 em');
    assert.ok(contrastRatio(darkAccentCopy.text, darkAccentCopy.background) >= 4.5);
  } finally {
    await page.close();
  }
});

test('media reserves image space and declares verified caption coverage', async () => {
  let videoCount = 0;
  let auditedImageCount = 0;

  for (const route of SITE_ROUTES) {
    const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    const source = await readFile(path.join(ROOT, filename), 'utf8');

    for (const video of source.match(/<video\b[^>]*>[\s\S]*?<\/video>/gi) || []) {
      videoCount += 1;
      const hasOpenCaptions = /\bdata-captioned="open"/i.test(video);
      const hasCaptionTrack = /<track\b[^>]*\bkind="captions"/i.test(video);
      assert.ok(hasOpenCaptions || hasCaptionTrack, `${filename} has a video without declared caption coverage`);
    }

    for (const image of source.match(/<img\b[^>]*>/gi) || []) {
      if (!/\bsrc="media\/(?:optimized|posters)\//i.test(image)) continue;
      auditedImageCount += 1;
      assert.match(image, /\bwidth="\d+"/i, `${filename} has an audited image without width`);
      assert.match(image, /\bheight="\d+"/i, `${filename} has an audited image without height`);
    }
  }

  assert.equal(videoCount, 40);
  assert.ok(auditedImageCount >= 15);
});

test('hover motion avoids layout properties and manifest colours match the design tokens', async () => {
  for (const filename of ['contact.css', 'services.css']) {
    const source = await readFile(path.join(ROOT, filename), 'utf8');
    assert.doesNotMatch(source, /transition[^;{}]*padding/i, `${filename} animates padding`);
    assert.doesNotMatch(source, /:hover\s*\{[^}]*padding-left/i, `${filename} changes padding on hover`);
  }

  const manifest = JSON.parse(await readFile(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.equal(manifest.background_color, '#F8F6DA');
  assert.equal(manifest.theme_color, '#4E342E');

  const workflow = await readFile(path.join(ROOT, '.github', 'workflows', 'static.yml'), 'utf8');
  assert.match(workflow, /Build lean site artifact/);
  assert.match(workflow, /path:\s*['_"]?_site/);
  assert.doesNotMatch(workflow, /path:\s*['"]?\.['"]?\s*$/m);
});

for (const viewport of [VIEWPORTS[0], HERO_MARQUEE_VIEWPORTS[2]]) {
  test(`standalone case-study layout stays compact at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      await open(page, '/case-resurrack-littlemissmarket');
      const layout = await page.evaluate(() => {
        const chips = document.querySelector('.case-chips').getBoundingClientRect();
        const deck = document.querySelector('.case-deck').getBoundingClientRect();
        const media = document.querySelector('.case-video-wrap').getBoundingClientRect();
        const story = document.querySelector('.case-story').getBoundingClientRect();
        const storyBlock = document.querySelector('.case-story-block').getBoundingClientRect();
        const storyLabel = document.querySelector('.case-story-block .case-expand-label').getBoundingClientRect();
        return {
          metadataGap: deck.top - chips.bottom,
          mediaWidth: media.width,
          storyBlockWidth: storyBlock.width,
          storyLeadGap: storyLabel.top - story.top,
        };
      });

      assert.ok(layout.metadataGap >= 40 && layout.metadataGap <= 64, `metadata-to-introduction gap is ${layout.metadataGap}px`);
      assert.ok(layout.mediaWidth <= 402, `standalone media is ${layout.mediaWidth}px wide`);
      assert.ok(layout.storyBlockWidth >= 900, `story row is only ${layout.storyBlockWidth}px wide`);
      assert.ok(layout.storyLeadGap <= 96, `story begins ${layout.storyLeadGap}px below its section edge`);
    } finally {
      await page.close();
    }
  });
}

for (const viewport of HERO_MARQUEE_VIEWPORTS) {
  test(`homepage hero meets the marquee and clears navigation at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport, { reducedMotion: false });
    try {
      await open(page, '/');

      const readLayout = () => page.evaluate(() => {
        const hero = document.querySelector('#hero-split');
        const bar = document.querySelector('.client-bar');
        const nav = document.querySelector('.kaci-nav');
        const services = document.querySelector('#section-services');
        const heroRect = hero.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();
        const servicesRect = services.getBoundingClientRect();
        const navStyle = getComputedStyle(nav);
        return {
          bannerDismissed: document.documentElement.classList.contains('banner-dismissed'),
          heroBottom: heroRect.bottom + window.scrollY,
          barTop: barRect.top + window.scrollY,
          barBottom: barRect.bottom + window.scrollY,
          servicesTop: servicesRect.top + window.scrollY,
          navRestingBottom: window.innerHeight - (parseFloat(navStyle.bottom) || 0),
        };
      });

      const assertFlushAndClear = (positions, phase) => {
        assert.ok(
          Math.abs(positions.barTop - positions.heroBottom) <= 1,
          `${phase}: hero ends at ${positions.heroBottom}px while marquee starts at ${positions.barTop}px`,
        );
        assert.ok(
          Math.abs(positions.servicesTop - positions.barBottom) <= 1,
          `${phase}: marquee ends at ${positions.barBottom}px while Services starts at ${positions.servicesTop}px`,
        );
        assert.ok(
          positions.barTop >= positions.navRestingBottom - 1,
          `${phase}: marquee starts at ${positions.barTop}px while navigation ends at ${positions.navRestingBottom}px`,
        );
      };

      const initial = await readLayout();
      assert.equal(initial.bannerDismissed, false);
      assertFlushAndClear(initial, 'with banner');

      await page.$eval('.kaci-banner-close', button => button.click());
      await page.reload({ waitUntil: 'domcontentloaded' });
      const dismissed = await readLayout();
      assert.equal(dismissed.bannerDismissed, true);
      assertFlushAndClear(dismissed, 'after persisted banner dismissal');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.setViewport({
        width: viewport.width - 80,
        height: viewport.height,
        deviceScaleFactor: 1,
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
      await new Promise(resolve => setTimeout(resolve, 50));

      const afterStress = await readLayout();
      assertFlushAndClear(afterStress, 'after scroll and resize');
    } finally {
      await page.close();
    }
  });
}

for (const viewport of VIEWPORTS.filter(item => item.width < 768)) {
  test(`mobile menu traps and restores focus at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      await open(page, '/contact');
      const closedState = await page.$eval('#kaci-mobile-menu', menu => ({
        hidden: menu.hidden,
        inert: menu.hasAttribute('inert'),
        ariaHidden: menu.getAttribute('aria-hidden'),
      }));
      assert.deepEqual(closedState, { hidden: true, inert: true, ariaHidden: 'true' });

      await page.click('.kaci-nav-hamburger');
      await page.waitForFunction(() => document.activeElement?.classList.contains('kaci-mobile-close'));
      assert.equal(await page.$eval('.kaci-nav-hamburger', button => button.getAttribute('aria-expanded')), 'true');

      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent.trim()), 'Contact');

      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('kaci-mobile-close')), true);

      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('kaci-nav-hamburger')), true);
      assert.equal(await page.$eval('#kaci-mobile-menu', menu => menu.hidden && menu.hasAttribute('inert')), true);
    } finally {
      await page.close();
    }
  });
}

for (const viewport of VIEWPORTS.filter(item => item.width < 768)) {
  test(`mobile navigation avoids headings and video controls at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport, { reducedMotion: false });
    try {
      for (const route of SITE_ROUTES) {
        await open(page, route);
        const initial = await page.evaluate(() => {
          const nav = document.querySelector('.kaci-nav-inner').getBoundingClientRect();
          const heading = document.querySelector('main h1').getBoundingClientRect();
          const plain = rect => ({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left });
          const inner = document.querySelector('.kaci-nav-inner');
          const navStyle = getComputedStyle(document.querySelector('.kaci-nav'));
          const innerStyle = getComputedStyle(inner);
          return {
            nav: plain(nav),
            heading: plain(heading),
            position: navStyle.position,
            wrapperTransform: navStyle.transform,
            wrapperAnimation: navStyle.animationName,
            innerAnimation: innerStyle.animationName,
          };
        });
        assert.equal(initial.position, 'fixed');
        assert.equal(initial.wrapperTransform, 'none');
        assert.equal(initial.wrapperAnimation, 'none');
        assert.equal(initial.innerAnimation, 'kaci-nav-rise');
        assert.equal(
          rectanglesOverlap(initial.nav, initial.heading),
          false,
          `${route} heading intersects navigation: ${JSON.stringify(initial)}`,
        );

        const hasCaseMedia = await page.$('.case-video-wrap');
        if (!hasCaseMedia) continue;

        const controls = await page.evaluate(async () => {
          const video = document.querySelector('.case-video-wrap');
          video.scrollIntoView({ block: 'center' });
          await new Promise(resolve => setTimeout(resolve, 380));
          const nav = document.querySelector('.kaci-nav-inner').getBoundingClientRect();
          const media = video.getBoundingClientRect();
          return {
            nav: { top: nav.top, right: nav.right, bottom: nav.bottom, left: nav.left },
            controlBand: {
              top: Math.max(media.top, media.bottom - 72),
              right: media.right,
              bottom: media.bottom,
              left: media.left,
            },
          };
        });
        assert.equal(
          rectanglesOverlap(controls.nav, controls.controlBand),
          false,
          `${route} controls intersect navigation: ${JSON.stringify(controls)}`,
        );
      }
    } finally {
      await page.close();
    }
  });
}

test('Services controls expose state and support keyboard operation', async () => {
  const page = await makePage(VIEWPORTS[1]);
  try {
    await open(page, '/services');

    const relationshipProblems = await page.evaluate(() => {
      const problems = [];
      document.querySelectorAll('[aria-controls]').forEach(control => {
        const panelId = control.getAttribute('aria-controls');
        if (!panelId || !document.getElementById(panelId)) problems.push(`Missing panel: ${panelId}`);
      });
      return problems;
    });
    assert.deepEqual(relationshipProblems, []);

    await page.focus('#service-tab-smm');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'service-tab-content');
    assert.equal(await page.$eval('#service-tab-content', button => button.getAttribute('aria-selected')), 'true');
    assert.equal(await page.$eval('#service-panel-content', panel => panel.hidden), false);
    assert.equal(await page.$eval('#service-panel-smm', panel => panel.hidden), true);

    await page.focus('#onboardChips .onboard-chip');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.$eval('#onboardChips .onboard-chip:nth-child(2)', button => button.getAttribute('aria-pressed')), 'true');
    assert.equal(await page.$eval('#onboard-step-2', panel => panel.getAttribute('aria-hidden')), 'false');
    assert.equal(await page.$eval('#onboard-step-1', panel => panel.hasAttribute('inert')), true);

    await page.focus('#faq-question-deliverables');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('#faq-question-deliverables', button => button.getAttribute('aria-expanded')), 'true');
    assert.equal(await page.$eval('#faq-answer-deliverables', panel => panel.hidden), false);
    await page.keyboard.press('Space');
    assert.equal(await page.$eval('#faq-question-deliverables', button => button.getAttribute('aria-expanded')), 'false');
    assert.equal(await page.$eval('#faq-answer-deliverables', panel => panel.hidden), true);
  } finally {
    await page.close();
  }
});

test('Services scroll-driven sections finish their entrance states', async () => {
  const page = await makePage(VIEWPORTS[0], { reducedMotion: false });
  try {
    await open(page, '/services');
    const sections = [
      ['.svc-cats', 'cats-entrance-done'],
      ['.onboarding', 'seq-done'],
      ['.studio-faq', 'faq-done'],
    ];

    for (const [selector, completedClass] of sections) {
      await page.$eval(selector, element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForFunction(
        (target, className) => document.querySelector(target)?.classList.contains(className),
        { timeout: 5_000 },
        selector,
        completedClass,
      );
    }

    const hiddenContent = await page.evaluate(() => [
      ['package heading', document.querySelector('.svc-cats h1')],
      ['onboarding heading', document.querySelector('.onboarding h2')],
      ['FAQ heading', document.querySelector('.studio-faq h2')],
      ['FAQ question', document.querySelector('.studio-faq-q')],
    ].flatMap(([label, element]) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return parseFloat(style.opacity) > 0 && rect.width > 0 && rect.height > 0 ? [] : [label];
    }));
    assert.deepEqual(hiddenContent, []);
  } finally {
    await page.close();
  }
});

test('contact honeypot stays submitted but is inert and hidden from assistive technology', async () => {
  const page = await makePage();
  try {
    await open(page, '/contact');
    const state = await page.$eval('.spam-field', field => ({
      ariaHidden: field.getAttribute('aria-hidden'),
      inert: field.hasAttribute('inert'),
      inFormData: new FormData(field.closest('form')).has(field.querySelector('input').name),
      tabIndex: field.querySelector('input').tabIndex,
    }));
    assert.deepEqual(state, { ariaHidden: 'true', inert: true, inFormData: true, tabIndex: -1 });
  } finally {
    await page.close();
  }
});

for (const viewport of VIEWPORTS) {
  test(`key pages have no horizontal overflow at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      for (const route of ['/', '/services', '/contact']) {
        await open(page, route);
        const overflow = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        }));
        assert.ok(
          overflow.content <= overflow.viewport + 1,
          `${route} overflows by ${overflow.content - overflow.viewport}px`,
        );
      }
    } finally {
      await page.close();
    }
  });
}

for (const viewport of VIEWPORTS.filter(item => item.width < 768)) {
  test(`mobile navigation stays outside the form at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      await open(page, '/contact');
      const positions = await page.evaluate(async () => {
        const submit = document.querySelector('.form-submit');
        const nav = document.querySelector('.kaci-nav');
        submit.scrollIntoView({ block: 'center' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const submitRect = submit.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const plain = rect => ({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left });
        return { submit: plain(submitRect), nav: plain(navRect) };
      });
      assert.equal(rectanglesOverlap(positions.submit, positions.nav), false);
    } finally {
      await page.close();
    }
  });
}
