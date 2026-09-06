import { resolve } from 'node:path';
import { api, save } from './api.ts';

const name = 'valtteri-connection';
const installed = await api('/api/canvas-extensions/installed');
const existing = installed.canvas_extensions.find((item: any) => item.name === name);
const source = resolve('probes/canvas-extension');
if (existing && existing.source !== source) throw new Error('A different extension uses the probe name; stopping.');
const result = await api('/api/canvas-extensions/install', 'POST', { source, force: !!existing });
await api(`/api/canvas-extensions/installed/${name}`, 'PATCH', { enabled: true });
await save('extension-install.json', { name, source, version: result.version, enabled: true, installedAt: result.installed_at });
console.log(`Installed and enabled ${name}. Existing extensions and defaults were not changed.`);
