import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import test from 'node:test';

test('preview rejects malformed and Windows-style paths without crashing', async () => {
  const server = spawn(process.execPath, ['serve.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '4186', HOST: '127.0.0.1' },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  function request(path) {
    return new Promise((resolve, reject) => {
      http.get({ hostname: '127.0.0.1', port: 4186, path }, response => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      }).on('error', reject);
    });
  }
  try {
    await once(server.stdout, 'data');
    for (const malformed of ['/%', '/%E0%A4%A']) assert.equal(await request(malformed), 400);
    for (const privatePath of ['/%00.html', '/%5c.git/config', '/assets%5c..%5cpackage.json', '/.git/config']) {
      assert.equal(await request(privatePath), 404, privatePath);
    }
    assert.equal(await request('/'), 200);
    assert.equal(await request('/about'), 200);
  } finally { server.kill(); }
});
