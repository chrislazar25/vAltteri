import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { api, runtime } from './api.ts';

const id = process.argv[3];
let owned = false;
for (const name of await readdir(runtime)) {
  if (!/^(native|opencode)-.*\.json$/.test(name)) continue;
  const record = JSON.parse(await readFile(resolve(runtime, name), 'utf8'));
  if (record.conversationId === id) owned = true;
}
if (!owned) throw new Error('Inspect only conversations recorded by these Phase 2 probes.');
const result = await api(`/api/conversations/${id}/events/search?limit=100`);
for (const event of result.items ?? result.events ?? []) {
  if (!['ConversationErrorEvent', 'AgentErrorEvent'].includes(event.kind)) continue;
  const detail = String(event.detail ?? event.message ?? '').replace(/(?:sk-|oh-)[A-Za-z0-9_-]{12,}/g, '[REDACTED]');
  console.log(JSON.stringify({ kind: event.kind, error: event.code ?? event.error, detail, fields: Object.keys(event) }));
}
