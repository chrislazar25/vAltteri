import { api, save } from './api.ts';

const info = await api('/server_info');
const settings = await api('/api/settings');
const profiles = await api('/api/profiles');
const agents = await api('/api/agent-profiles');
const extensions = await api('/api/canvas-extensions/installed');
const schema = await api('/openapi.json');
function summarize(value: any): any {
  if (Array.isArray(value)) return value.map(summarize);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  const fields = ['id', 'name', 'model', 'agent_kind', 'kind', 'enabled', 'active',
    'active_profile', 'active_profile_name', 'active_agent_profile_id', 'profile_id',
    'agent_profile_id', 'llm_profile', 'llm_profile_name', 'provider_connection_id',
    'auth_type', 'is_subscription', 'profiles', 'agent_profiles', 'canvas_extensions'];
  for (const k of fields) if (k in value) out[k] = summarize(value[k]);
  out.keys = Object.keys(value);
  return out;
}
const inventory = {
  recordedAt: new Date().toISOString(), info,
  settings: summarize(settings), profiles: summarize(profiles),
  agents: summarize(agents), extensions: summarize(extensions),
  relevantRoutes: Object.keys(schema.paths).filter(p => /conversations|canvas-extensions|agent-profiles/.test(p)),
};
await save('inventory.json', inventory);
await save('openapi.json', schema);
console.log(JSON.stringify(inventory, null, 2));
