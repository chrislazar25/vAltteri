import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runtime } from './api.ts';

export async function startDiagnosticServer(options: {
  port?: number; token?: string; origins?: string[]; record?: boolean;
} = {}) {
  const token = options.token ?? randomBytes(32).toString('hex');
  const origins = options.origins ?? ['http://127.0.0.1:8000', 'http://localhost:8000'];
  const server = createServer((req, res) => {
    void handle().catch(() => { if (!res.headersSent) res.writeHead(500); res.end(); });
    async function handle() {
      const origin = req.headers.origin;
      const host = req.headers.host;
      const port = (server.address() as { port: number }).port;
      const reply = (status: number, value: unknown) => {
        res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(value));
      };
      res.setHeader('Vary', 'Origin');
      if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host ?? '')) return reply(403, { error: 'Host rejected' });
      if (origin && !origins.includes(origin)) return reply(403, { error: 'Origin rejected' });
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
      if (req.url !== '/connection-check') return reply(404, { error: 'Unknown endpoint' });
      if (req.method === 'OPTIONS') {
        if (req.headers['access-control-request-method'] !== 'GET') return reply(405, { error: 'Method rejected' });
        const headers = String(req.headers['access-control-request-headers'] ?? '').toLowerCase().split(',').map(x => x.trim());
        if (headers.some(h => h && h !== 'authorization')) return reply(403, { error: 'Headers rejected' });
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization');
        res.writeHead(204); return res.end();
      }
      if (req.method !== 'GET') return reply(405, { error: 'Method rejected' });
      const supplied = Buffer.from(req.headers.authorization ?? '');
      const expected = Buffer.from(`Bearer ${token}`);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        return reply(401, { error: 'Authentication required' });
      }
      const result = { service: 'valtteri-phase-2', requestId: randomUUID(), timestamp: new Date().toISOString() };
      if (options.record) await appendFile(resolve(runtime, 'connection-events.jsonl'), JSON.stringify(result) + '\n', { mode: 0o600 });
      reply(200, result);
    }
  });
  await new Promise<void>((accept, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 18080, '127.0.0.1', accept);
  });
  return { server, token, url: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
}

export async function main() {
  await mkdir(runtime, { recursive: true, mode: 0o700 });
  const instance = await startDiagnosticServer({ record: true });
  await writeFile(resolve(runtime, 'connection-token.txt'), instance.token, { mode: 0o600 });
  console.log(`Diagnostic server: ${instance.url}. Token saved privately in runtime/phase-2/connection-token.txt.`);
  const stop = () => { instance.server.closeAllConnections(); instance.server.close(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
