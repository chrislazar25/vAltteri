const actions: Record<string, string> = {
  inventory: './inventory.ts', server: './server.ts', native: './native-worker.ts',
  opencode: './opencode-worker.ts', extension: './extension.ts', browser: './browser.ts',
  inspect: './inspect-worker.ts',
  usage: './usage.ts',
  finalize: './finalize.ts',
};
const action = process.argv[2];
if (!actions[action]) throw new Error(`Choose a Phase 2 probe: ${Object.keys(actions).join(', ')}`);
const loaded = await import(actions[action]);
if (typeof loaded.main === 'function') await loaded.main();
export {};
