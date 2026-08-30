import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(ROOT, '_site');

const PUBLIC_ROOT_FILES = [
  'index.html',
  'about.html',
  'services.html',
  'work.html',
  'contact.html',
  'privacy-policy.html',
  '404.html',
  'case-brixx-derma.html',
  'case-coffeeman-nyp.html',
  'case-fino.html',
  'case-flyco.html',
  'case-happy-rei.html',
  'case-luminance-learning.html',
  'case-melissa-shoes.html',
  'case-resurrack-littlemissmarket.html',
  'index.css',
  'about.css',
  'services.css',
  'work.css',
  'contact.css',
  'privacy-policy.css',
  '404.css',
  'case-study.js',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'googleb759c4218c55b228.html',
  '7c8186c3e8bbd7c170afbba65bc7de91.txt',
  'apple-touch-icon.png',
  '_headers',
];

const PUBLIC_TREES = [
  {
    directory: 'assets',
    allow: relative => ['.css', '.js'].includes(path.extname(relative).toLowerCase()),
  },
  {
    directory: 'Brand fonts',
    allow: relative => path.extname(relative).toLowerCase() === '.woff2' || relative === 'BootzyTM.ttf',
  },
  {
    directory: 'Logo',
    allow: relative => [
      'Primary Logo (Blue).png',
      'Primary Logo (Blue)-320.webp',
      'Secondary Logo (White)-320.webp',
    ].includes(relative),
  },
  {
    directory: path.join('media', 'optimized'),
    allow: relative => path.extname(relative).toLowerCase() === '.webp',
  },
  {
    directory: path.join('media', 'posters'),
    allow: relative => ['.jpg', '.jpeg', '.webp'].includes(path.extname(relative).toLowerCase()),
  },
  {
    directory: path.join('media', "Kaci's Clients"),
    allow: relative => ['.jpg', '.jpeg', '.webp'].includes(path.extname(relative).toLowerCase()),
  },
];

const FORBIDDEN_OUTPUT_NAMES = new Set([
  'package.json',
  'package-lock.json',
  'readme.md',
  'handoff.md',
  'handsoff.md',
  'website discovery guide.docx',
  'serve.mjs',
  'build-site.mjs',
  'screenshot.mjs',
  'start-local.ps1',
  'start-local.cmd',
  '.impeccable.md',
  '.assetsignore',
  'colour-reference.html',
  'colour-reference.css',
]);

function resolveWithin(base, relative) {
  const resolved = path.resolve(base, relative);
  const boundary = path.resolve(base) + path.sep;
  if (resolved !== path.resolve(base) && !resolved.startsWith(boundary)) {
    throw new Error(`Path escapes build boundary: ${relative}`);
  }
  return resolved;
}

async function copyRelative(relative) {
  const source = resolveWithin(ROOT, relative);
  const target = resolveWithin(OUTPUT, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
}

async function copyTree(directory, allow) {
  const sourceRoot = resolveWithin(ROOT, directory);

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const source = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(source);
        continue;
      }
      if (!entry.isFile()) continue;

      const relativeInsideTree = path.relative(sourceRoot, source);
      if (!allow(relativeInsideTree)) continue;
      await copyRelative(path.join(directory, relativeInsideTree));
    }
  }

  await visit(sourceRoot);
}

async function outputFiles() {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) files.push(path.relative(OUTPUT, absolute));
    }
  }
  await visit(OUTPUT);
  return files;
}

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });

for (const relative of PUBLIC_ROOT_FILES) await copyRelative(relative);
for (const tree of PUBLIC_TREES) await copyTree(tree.directory, tree.allow);

const releaseDate = process.env.SITE_LASTMOD || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
  throw new Error(`SITE_LASTMOD must use YYYY-MM-DD, received: ${releaseDate}`);
}
const sitemapPath = path.join(OUTPUT, 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
await writeFile(sitemapPath, sitemap.replace(/<lastmod>[^<]+<\/lastmod>/g, `<lastmod>${releaseDate}</lastmod>`));

const files = await outputFiles();
const forbidden = files.filter(relative => {
  const normalized = relative.replaceAll('\\', '/').toLowerCase();
  const basename = path.basename(relative).toLowerCase();
  return FORBIDDEN_OUTPUT_NAMES.has(basename)
    || normalized.startsWith('tests/')
    || normalized.startsWith('.git/')
    || ['.docx', '.md', '.mjs', '.ps1', '.cmd', '.otf'].includes(path.extname(relative).toLowerCase());
});

if (forbidden.length) {
  throw new Error(`Forbidden files entered the public artifact:\n${forbidden.join('\n')}`);
}

const bytes = (await Promise.all(files.map(async relative => (await stat(path.join(OUTPUT, relative))).size)))
  .reduce((total, size) => total + size, 0);

console.log(`Built ${files.length} public files (${(bytes / 1024 / 1024).toFixed(2)} MB) in _site`);
