import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { startDiagnosticServer } from './server.ts';

test('local service requires authentication and rejects unrelated browser origins', async () => {
  const instance = await startDiagnosticServer({ port: 0 });
  const request = (headers: Record<string, string> = {}, method = 'GET') => fetch(`${instance.url}/connection-check`, { headers, method });
  try {
    assert.equal((await request()).status, 401);
    assert.equal((await request({ Authorization: 'Bearer wrong' })).status, 401);
    const headers = { Authorization: `Bearer ${instance.token}`, Origin: 'http://127.0.0.1:8000' };
    const valid = await request(headers);
    assert.equal(valid.status, 200);
    assert.equal(valid.headers.get('Access-Control-Allow-Origin'), headers.Origin);
    const result = await valid.json();
    assert.equal(result.service, 'valtteri-phase-2');
    assert.match(result.requestId, /^[a-f0-9-]{36}$/);
    assert.ok(Number.isFinite(Date.parse(result.timestamp)));
    assert.equal((await request({ ...headers, Origin: 'https://unrelated.example' })).status, 403);
    const rejectedHost = await new Promise<number | undefined>((accept, reject) => {
      const req = httpRequest(`${instance.url}/connection-check`, { headers: { ...headers, Host: 'unrelated.example' } }, response => {
        response.resume(); accept(response.statusCode);
      });
      req.on('error', reject); req.end();
    });
    assert.equal(rejectedHost, 403);
    const preflight = await request({ Origin: headers.Origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' }, 'OPTIONS');
    assert.equal(preflight.status, 204);
    assert.equal((await request(headers, 'POST')).status, 405);
    assert.equal((await fetch(`${instance.url}/unknown`, { headers })).status, 404);
  } finally { instance.server.closeAllConnections(); await new Promise<void>(r => instance.server.close(() => r())); }
});
