import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const routes = JSON.parse(await readFile(new URL('../_routes.json', import.meta.url), 'utf8'));
const middlewareSource = await readFile(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
const middlewareUrl = `data:text/javascript;base64,${Buffer.from(middlewareSource).toString('base64')}`;
const { onRequest } = await import(middlewareUrl);

const requiredBlockedRoutes = [
  '/.impeccable.md',
  '/Website*',
  '/global.js',
  '/package.json',
  '/serve.mjs',
  '/tests/*',
];

test('Cloudflare invokes the guard only for internal routes', () => {
  assert.equal(routes.version, 1);
  assert.deepEqual(routes.exclude, []);
  for (const route of requiredBlockedRoutes) {
    assert.ok(routes.include.includes(route), `Missing protected route: ${route}`);
  }
  assert.ok(!routes.include.includes('/*'), 'Public site traffic must remain static');
});

test('edge guard returns a non-cacheable 404', async () => {
  const response = await onRequest();

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not Found\n');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
