import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { api, runtime, save, safeState } from './api.ts';

const inventory = JSON.parse(await readFile(resolve(runtime, 'inventory.json'), 'utf8'));
const settings = await api('/api/settings');
if (settings.active_profile !== inventory.settings.active_profile || settings.active_agent_profile_id !== inventory.settings.active_agent_profile_id) {
  throw new Error('Active profile differs from the initial inventory; inspect before completing the phase.');
}
const runs = [];
for (const filename of (await readdir(runtime)).filter(n => /^(native|opencode)-.*\.json$/.test(n)).sort()) {
  const record = JSON.parse(await readFile(resolve(runtime, filename), 'utf8'));
  if (!record.conversationId) continue;
  const current = safeState(await api(`/api/conversations/${record.conversationId}`));
  if (!['finished', 'error', 'paused'].includes(current.execution_status)) throw new Error(`Probe ${record.runId} is still active.`);
  const mode = record.mode ?? 'interrupt';
  await api(`/api/conversations/${record.conversationId}`, 'PATCH', {
    title: `vAltteri Phase 2 · ${record.worker} · ${mode} · ${record.result}`,
  });
  const started = await readFile(resolve(record.directory, 'gate-started'), 'utf8').catch(() => null);
  const finished = await readFile(resolve(record.directory, 'gate-finished'), 'utf8').catch(() => null);
  if (started && !finished) throw new Error(`Fixture ${record.runId} has not recorded its exit.`);
  const pause = record.observations.find((o: any) => o.action === 'paused-window')?.details;
  const interruption = record.observations.find((o: any) => o.action === 'interrupt-returned')?.details;
  runs.push({ runId: record.runId, conversationId: record.conversationId, worker: record.worker, mode,
    result: record.result, reportValid: record.reportValid ?? null, finalStatus: current.execution_status,
    model: current.model, startedAt: record.startedAt, finishedAt: record.finishedAt,
    interruptResponseMs: interruption?.elapsedMs ?? null,
    toolContinuedWhilePaused: pause?.toolHeartbeatContinued ?? null,
    fixtureFinished: started ? !!finished : null, eventKinds: record.eventKinds,
    errorCodes: record.events?.filter((e: any) => e.error).map((e: any) => e.error) ?? [],
  });
}
const usage = JSON.parse(await readFile(resolve(runtime, 'usage-comparison.json'), 'utf8'));
const browser = JSON.parse(await readFile(resolve(runtime, 'browser-result.json'), 'utf8'));
const canvasPackage = JSON.parse(await readFile(process.env.VALTTERI_CANVAS_PACKAGE ??
  resolve(dirname(process.execPath), '../lib/node_modules/@openhands/agent-canvas/package.json'), 'utf8'));
const { stdout: opencodeVersion } = await promisify(execFile)(resolve(homedir(), '.opencode/bin/opencode'), ['--version']);
const evidence = {
  recordedAt: new Date().toISOString(), phase: 2,
  versions: { canvasPackage: canvasPackage.version, agentServer: inventory.info.version, sdk: inventory.info.sdk_version,
    opencode: opencodeVersion.trim(), node: process.version, browser: browser.browser },
  defaultProfilesUnchanged: true,
  connection: { authenticatedCanvasHelper: browser.authenticatedCanvasHelper,
    wrongTokenRejectedInBrowser: browser.wrongTokenRejected, result: browser.serviceConnection },
  runs, usage: usage.runs.map(({ openCodeMessages, openCodeSession, ...row }: any) => row),
  estimatedRecordedCostUSD: usage.runs.reduce((sum: number, run: any) => sum + (run.sdkCostEstimateUSD ?? 0), 0),
  costNote: 'Sum of available runtime estimates only; failed attempts with unavailable cost are not treated as zero. Provider billing was not independently audited. OpenCode exports corroborate cost estimates but expose more tokens than ACP reports.',
};
await writeFile(resolve('docs/phase-2-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
await save('finalization.json', { recordedAt: evidence.recordedAt, defaultProfilesUnchanged: true, allProbesInactive: true, allStartedFixturesFinished: true });
console.log(JSON.stringify({ runs: runs.length, allProbesInactive: true, allStartedFixturesFinished: true,
  defaultProfilesUnchanged: true, estimatedRecordedCostUSD: evidence.estimatedRecordedCostUSD }));
