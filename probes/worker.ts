import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';
import { api, runtime, safeState, save } from './api.ts';

export async function exerciseWorker(kind: 'native' | 'opencode', agent: unknown, secretsEncrypted = false) {
  if (process.argv[3] && !['steer', 'interrupt'].includes(process.argv[3])) throw new Error('Choose steer or interrupt.');
  const mode = process.argv[3] === 'steer' ? 'steer' : 'interrupt';
  const runId = `${kind}-${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const directory = resolve(runtime, runId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const file of ['tickets.json', 'gate.py']) await copyFile(resolve('probes/fixtures', file), resolve(directory, file));
  const initialMarker = randomUUID();
  const evidence: any = { runId, mode, startedAt: new Date().toISOString(), worker: kind, directory,
    probeAllowanceUSD: 2, allowanceNote: 'A probe planning allowance, not a provider-enforced hard cutoff.',
    observations: [], result: 'incomplete' };
  let conversationId: string | undefined;
  const note = async (action: string, details: unknown) => {
    evidence.observations.push({ at: new Date().toISOString(), action, details });
    await save(`${runId}.json`, evidence);
    console.log(`${kind}: ${action}`);
  };
  const file = (name: string) => readFile(resolve(directory, name), 'utf8').catch(() => null);
  const state = async () => safeState(await api(`/api/conversations/${conversationId}`));
  const until = async (description: string, check: () => Promise<boolean>, timeout = 60000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await check()) return;
      const s = await state();
      if (['error', 'stuck'].includes(s.execution_status)) throw new Error(`${description}: worker entered ${s.execution_status}`);
      await delay(750);
    }
    throw new Error(`${description}: timed out after ${timeout / 1000}s`);
  };
  await note('attempt-recorded', { model: (agent as any)?.llm?.model ?? (agent as any)?.acp_model });
  try {
    const created = await api('/api/conversations', 'POST', {
      conversation_id: randomUUID(), workspace: { kind: 'LocalWorkspace', working_dir: directory },
      agent, secrets_encrypted: secretsEncrypted, max_iterations: 8, stuck_detection: true, autotitle: false,
      confirmation_policy: { kind: 'NeverConfirm' }, plugins: [],
      tags: { project: 'valtteri', phase: '2', probe: kind },
    });
    conversationId = created.id;
    evidence.conversationId = conversationId;
    await api(`/api/conversations/${conversationId}`, 'PATCH', { title: `vAltteri Phase 2 · ${kind} · ${mode}` });
    await note('created', safeState(created));
    const prompt = `This is a bounded local integration test. Work only in ${directory}. Do not use the network, delegate, or inspect other directories. First execute python3 gate.py once in the foreground (allow up to 60 seconds). The test driver will release it. Do not modify gate.py or create gate-release. After it returns, read tickets.json and write report.json containing counts_by_status and initial_marker. initial_marker is ${initialMarker}. Keep output short. Follow any later user message that changes the report format. If interrupted, resume the report when asked; do not restart a timed-out gate.`;
    await api(`/api/conversations/${conversationId}/events`, 'POST', { content: [{ type: 'text', text: prompt }], run: true });
    await note('launched', await state());
    await until('wait for active terminal fixture', async () => !!await file('gate-started'), 90000);
    await note('active-tool-observed', { state: await state(), heartbeatPresent: !!await file('gate-heartbeat') });
    await api(`/api/conversations/${conversationId}/events`, 'POST', {
      content: [{ type: 'text', text: 'Change the report format: report.json must contain counts_by_priority (high, medium, low), initial_marker from my first message, and steering_applied: true. Omit counts_by_status. Continue only in the assigned directory.' }], run: false,
    });
    await note('steering-sent-while-active', await state());
    if (mode === 'interrupt') {
      const start = Date.now();
      await api(`/api/conversations/${conversationId}/interrupt`, 'POST');
      await note('interrupt-returned', { elapsedMs: Date.now() - start, state: await state() });
      await until('wait for interrupted state', async () => (await state()).execution_status === 'paused', 15000);
      const before = await file('gate-heartbeat');
      await delay(1500);
      const after = await file('gate-heartbeat');
      await note('paused-window', { state: await state(), toolHeartbeatContinued: !!before && !!after && before !== after,
        reportExists: !!await file('report.json') });
      await writeFile(resolve(directory, 'gate-release'), 'released by test driver');
      await note('fixture-release', { reason: 'Ensure any remaining local tool process can finish before resumption.' });
      // Give the released command a chance to exit; this is not proof the interrupt killed it.
      await delay(1000);
      await api(`/api/conversations/${conversationId}/run`, 'POST');
      await note('resume-requested-same-conversation', await state());
    } else {
      await writeFile(resolve(directory, 'gate-release'), 'released after active steering');
      await note('fixture-release-without-manual-interrupt-or-resume', await state());
    }
    await until('wait for resumed report', async () => !!await file('report.json'), 120000);
    await until('wait for completion', async () => (await state()).execution_status === 'finished', 60000);
    const report = JSON.parse((await file('report.json'))!);
    const expected = { counts_by_priority: { high: 3, medium: 3, low: 2 }, initial_marker: initialMarker, steering_applied: true };
    evidence.reportValid = isDeepStrictEqual(report, expected);
    evidence.finalState = await state();
    evidence.result = evidence.reportValid ? 'passed' : 'report-mismatch';
    await note('report-verified', { valid: evidence.reportValid, sameConversation: true, retainedInitialMarker: report.initial_marker === initialMarker });
  } catch (error) {
    evidence.result = 'failed'; evidence.error = error instanceof Error ? error.message : String(error);
    await note('probe-failed', { error: evidence.error });
    process.exitCode = 1;
  } finally {
    await writeFile(resolve(directory, 'gate-release'), 'cleanup release');
    if (conversationId) {
      try {
        const s = await state();
        if (s.execution_status === 'running') await api(`/api/conversations/${conversationId}/interrupt`, 'POST');
        evidence.finalState = await state();
        const page = await api(`/api/conversations/${conversationId}/events/search?limit=100`);
        const events = page.items ?? page.events ?? [];
        evidence.eventKinds = [...new Set(events.map((event: any) => event.kind))];
        evidence.events = events.map((event: any) => ({ id: event.id, kind: event.kind, source: event.source, timestamp: event.timestamp,
          toolName: event.tool_name ?? event.action?.kind ?? null,
          error: event.kind === 'ConversationErrorEvent' ? event.code ?? event.error ?? event.detail ?? 'worker error' : undefined,
        }));
        evidence.eventsTruncated = !!page.next_page_id;
        evidence.usageNote = 'Token/cost figures are reported by the runtime. Cost is an SDK estimate unless independently confirmed by a provider; missing figures are unavailable.';
      } catch (error) { evidence.cleanupError = error instanceof Error ? error.message : String(error); }
    }
    evidence.finishedAt = new Date().toISOString();
    await save(`${runId}.json`, evidence);
    console.log(JSON.stringify({ runId, conversationId, result: evidence.result, reportValid: evidence.reportValid,
      model: evidence.finalState?.model, status: evidence.finalState?.execution_status,
      error: evidence.error, eventKinds: evidence.eventKinds }, null, 2));
  }
  return evidence;
}
