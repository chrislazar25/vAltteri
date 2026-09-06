import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { exerciseWorker } from './worker.ts';

// These process-local overrides do not edit OpenCode's global configuration.
// The existing OpenCode credential store supplies Zen authentication.
const model = 'opencode/claude-haiku-4-5';
const config = {
  model, small_model: model, share: 'disabled', autoupdate: false,
  agent: { build: { steps: 8 } },
  permission: { '*': 'deny', read: 'allow', edit: 'allow', bash: 'allow', glob: 'allow', grep: 'allow' },
};
await exerciseWorker('opencode', {
  kind: 'ACPAgent',
  acp_command: ['/usr/bin/env', `OPENCODE_CONFIG_CONTENT=${JSON.stringify(config)}`,
    resolve(homedir(), '.opencode/bin/opencode'), 'acp', '--pure'],
  acp_prompt_timeout: 120, acp_startup_timeout: 30,
  agent_context: { load_user_skills: false, load_public_skills: false },
});
