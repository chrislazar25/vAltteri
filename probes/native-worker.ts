import { api } from './api.ts';
import { exerciseWorker } from './worker.ts';

// Round-trip only the existing LLM credential in encrypted form, using the
// Agent Server's supported secret-export API. Never persist or print it.
const settings = await api('/api/settings', 'GET', undefined, { 'X-Expose-Secrets': 'encrypted' });
const current = settings.agent_settings?.llm;
if (!current?.api_key || current.api_key === '**********') throw new Error('The active native LLM has no encrypted credential to reuse.');
await exerciseWorker('native', {
  kind: 'Agent',
  llm: { model: current.model, api_key: current.api_key, base_url: current.base_url,
    usage_id: 'valtteri-phase2-native', max_output_tokens: 1200, num_retries: 0,
    timeout: 60, reasoning_effort: 'none', extended_thinking_budget: 0 },
  tools: [{ name: 'terminal' }, { name: 'file_editor' }],
  agent_context: { load_user_skills: false, load_public_skills: false, load_project_skills: false, load_memory: false },
}, true);
