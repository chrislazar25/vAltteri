import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runtime, save } from './api.ts';

const runs = [];
for (const name of (await readdir(runtime)).filter(n => /^(native|opencode)-.*\.json$/.test(n)).sort()) {
  const record = JSON.parse(await readFile(resolve(runtime, name), 'utf8'));
  const metrics = Object.values(record.finalState?.stats?.usage_to_metrics ?? {}) as any[];
  const reported = metrics.filter(m => m.costs?.length || m.token_usages?.length);
  const summary: any = { runId: record.runId, conversationId: record.conversationId, result: record.result,
    model: record.finalState?.model ?? null,
    sdkCostEstimateUSD: reported.length ? reported.reduce((sum, m) => sum + m.accumulated_cost, 0) : null,
    sdkReportedTokens: reported.map(m => m.accumulated_token_usage),
    costStatus: reported.length ? 'estimated' : 'unavailable',
  };
  if (record.worker === 'opencode') {
    const sessionId = metrics.flatMap(m => m.response_latencies ?? []).find(x => /^ses_/.test(x.response_id))?.response_id;
    if (sessionId) {
      const { stdout } = await promisify(execFile)(resolve(homedir(), '.opencode/bin/opencode'), ['export', sessionId], { maxBuffer: 10 * 1024 * 1024, timeout: 15000 });
      const session = JSON.parse(stdout);
      if (session.info?.directory !== record.directory) throw new Error('Exported OpenCode session does not belong to this probe directory.');
      const messages = session.messages.filter((m: any) => m.info?.role === 'assistant').map((m: any) => ({
        id: m.info.id, model: m.info.modelID, provider: m.info.providerID,
        cost: m.info.cost ?? null, tokens: m.info.tokens ?? null,
        finish: m.info.finish ?? null, completed: m.info.time?.completed ?? null,
      }));
      summary.openCodeSession = sessionId;
      summary.openCodeMessages = messages;
      summary.openCodeCostEstimateUSD = messages.reduce((sum: number, m: any) => sum + (m.cost ?? 0), 0);
      summary.openCodeReportedTokens = messages.reduce((sum: any, m: any) => {
        const t = m.tokens ?? {};
        for (const key of ['input', 'output', 'reasoning']) sum[key] += t[key] ?? 0;
        sum.cacheRead += t.cache?.read ?? 0; sum.cacheWrite += t.cache?.write ?? 0;
        return sum;
      }, { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 });
    }
  }
  runs.push(summary);
}
await save('usage-comparison.json', { at: new Date().toISOString(), runs });
for (const { openCodeMessages, ...summary } of runs) console.log(JSON.stringify(summary));
