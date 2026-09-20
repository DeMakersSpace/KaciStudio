import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { checkRequest } from './maintenance-request.mjs';

test('maintenance requests accept public success and expected private-path 404', async () => {
  assert.equal(await checkRequest('https://example.test/page', { fetchImpl: async () => new Response(null, { status: 200 }) }), null);
  assert.equal(await checkRequest('https://example.test/private', {
    method: 'GET', expectedStatus: 404, fetchImpl: async () => new Response('Not found', { status: 404 }),
  }), null);
});

test('maintenance reports exact HTTP/network failures and can continue checking', async () => {
  const results = [];
  for (const path of ['broken', 'offline', 'healthy']) {
    results.push(await checkRequest(`https://example.test/${path}`, {
      fetchImpl: async () => {
        if (path === 'offline') throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
        return new Response(null, { status: path === 'broken' ? 500 : 200 });
      },
    }));
  }
  assert.equal(results[0], 'HTTP 500: HEAD https://example.test/broken');
  assert.match(results[1], /Network error: HEAD https:\/\/example.test\/offline: fetch failed \(ECONNRESET\)/);
  assert.equal(results[2], null);
});

test('maintenance reports URL and method when the request deadline expires', async () => {
  const result = await checkRequest('https://example.test/stalled', {
    method: 'GET', timeoutMs: 10,
    fetchImpl: async (url, { signal }) => {
      await setTimeout(1000, undefined, { signal });
      return new Response(null);
    },
  });
  assert.equal(result, 'Timeout after 10ms: GET https://example.test/stalled');
});
