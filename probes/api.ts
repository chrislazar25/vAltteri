import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

export const runtime = resolve('runtime/phase-2');
export const agentUrl = process.env.VALTTERI_AGENT_URL ?? 'http://127.0.0.1:18000';
export const canvasUrl = process.env.VALTTERI_CANVAS_URL ?? 'http://127.0.0.1:8000';

export async function api(path: string, method = 'GET', body?: unknown, extraHeaders: Record<string, string> = {}): Promise<any> {
  const url = new URL(agentUrl);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('Phase 2 probes are limited to a loopback Agent Server.');
  }
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Expected an API path.');
  const key = process.env.VALTTERI_AGENT_KEY ?? (await readFile(
    process.env.VALTTERI_AGENT_KEY_FILE ?? resolve(homedir(), '.openhands/agent-canvas/api-key.txt'),
    'utf8',
  )).trim();
  const response = await fetch(`${url.origin}${path}`, {
    method, redirect: 'error', signal: AbortSignal.timeout(60_000),
    headers: { ...extraHeaders, 'X-Session-API-Key': key, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) {
    // Do not print request payloads, response bodies, or credentials on errors.
    throw new Error(`${method} ${path}: HTTP ${response.status}`);
  }
  return value;
}

export async function save(name: string, value: unknown): Promise<void> {
  await mkdir(runtime, { recursive: true, mode: 0o700 });
  await writeFile(resolve(runtime, name), JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
}

export function safeState(value: any) {
  return {
    id: value.id, execution_status: value.execution_status, title: value.title,
    model: value.current_model_id ?? value.agent?.llm?.model ?? null,
    stats: value.stats ?? null, metrics: value.metrics ?? null,
    created_at: value.created_at, updated_at: value.updated_at,
  };
}
