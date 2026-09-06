Phase 2 review walkthrough

This is the entry point for reviewing what was built, what happened during the tests, and what remains unresolved. The evidence below comes from the completed September 5, 2026 session; reviewing it does not start another agent run. Phase 3 is still awaiting authorization.

Phase 2 asked: can our own code reach Canvas and control the existing workers well enough to build vAltteri on top of them? The deliverable is a small connection-test kit. The task service, database, task board, and coordinator come in later phases.

1. **See what was built.**

| Piece | What it does | Where to inspect |
|---|---|---|
| Canvas diagnostic page | Adds a sidebar page with two connection-check buttons, a service address, and a token field. | [Page source](../probes/canvas-extension/extension.js), [saved screenshot](../runtime/phase-2/canvas-connection.png) |
| TypeScript diagnostic server | Answers an authenticated request with a request ID and timestamp. Rejects missing/wrong credentials and disallowed request origins/hosts. | [Server](../probes/server.ts), [HTTP checks](../probes/connection.test.ts) |
| Shared worker scenario | Starts a conversation, waits for actual work, sends new instructions, optionally interrupts/resumes, and checks the output. | [Scenario](../probes/worker.ts) |
| Native worker setup | Supplies the existing native model configuration and bounded tools/limits to the OpenHands Agent Server. | [Native setup](../probes/native-worker.ts) |
| OpenCode setup | Asks the Agent Server's existing ACP integration to launch OpenCode with a test-specific model/configuration. ACP is the protocol used to communicate with that worker. | [OpenCode setup](../probes/opencode-worker.ts) |
| Evidence collection | Records attempts, observed state, output checks, usage comparisons, and cleanup. | [Usage comparison code](../probes/usage.ts), [final checks](../probes/finalize.ts), [sanitized results](phase-2-evidence.json) |

The Canvas page and worker scripts are separate tests. Clicking the page's connection button does **not** start a worker. The tested paths are:

```text
Canvas diagnostic page
  |-- existing Canvas authenticated helper --> OpenHands Agent Server
  '-- separate connection token ------------> local TS diagnostic server

TypeScript worker test scripts --> OpenHands Agent Server
                                    |-- native OpenHands agent / SDK
                                    '-- existing ACP integration --> OpenCode
```

Our TypeScript scripts call the existing server's HTTP API. The native agent runs in the OpenHands runtime; we did not implement an agent reasoning loop in TypeScript.

2. **Understand the assignment before judging the result.**

Each worker received [eight fictional tickets](../probes/fixtures/tickets.json). Initially it was told to count them by **status** and remember a randomly generated marker. While a terminal command was active, the test sent a new instruction: count by **priority** instead, retain the original marker, and omit the status counts.

Eight tickets give us a small, varied input with an exact answer: high = 3, medium = 3, low = 2. Eight is a fixture size, not a product limit or eight separate implementation tasks.

[gate.py](../probes/fixtures/gate.py) is a deliberately waiting terminal command. It updates a heartbeat file every quarter second until the test releases it, with a 60-second timeout. That makes it possible to send controls during observable work and check whether the command continues after an interruption.

The test checks the actual output file against the exact expected object. A worker saying “done” or setting `steering_applied` alone cannot pass it. The random marker checks retention of a specific piece of initial context; it does not establish perfect memory or reliability on larger tasks.

3. **Follow one real run from start to finish.**

Open the [native interrupt/resume record](../runtime/phase-2/native-2026-09-06T01-11-22-975Z.json). Its `observations` array contains this sequence. Times below are UTC on September 6 (the evening of September 5 in Chicago).

| Time | What the record shows | Why it matters |
|---|---|---|
| 01:11:23 | Conversation launched and entered `running`. | API creation led to actual execution. |
| 01:11:27 | Terminal fixture observed; revised instruction sent while `running`. | The instruction arrived during work. |
| 01:11:27 | Interrupt returned; state became `paused`. | The agent accepted the pause request. |
| 01:11:29 | State still `paused`, heartbeat changed, report absent. | The already-running terminal command had **not stopped**. |
| 01:11:29–30 | Test explicitly released the fixture, then resumed the same conversation. | Cleanup and resumption were deliberate; interruption did not kill the command. |
| 01:11:42 | Exact report verified, original marker retained, conversation finished. | The worker followed the revision and retained the checked context. |

The worker's [actual report](../runtime/phase-2/native-2026-09-06T01-11-22-975Z/report.json) is:

```json
{
  "counts_by_priority": { "high": 3, "medium": 3, "low": 2 },
  "initial_marker": "88fda01b-b313-4923-9907-b7f430fd2996",
  "steering_applied": true
}
```

Two additional steering-only runs established that both workers could follow the changed instruction without our scripts manually interrupting or resuming them. This means a new message affected their eventual output; it does not mean it rewrote an already-executing command.

All five attempt records are retained:

| Attempt | Result | Local record |
|---|---|---|
| Native initial launch | Failed: credentials did not resolve | [Failed attempt](../runtime/phase-2/native-2026-09-06T01-08-56-717Z.json) |
| Native interrupt/resume | Passed report/context checks; terminal continued while paused | [Native control run](../runtime/phase-2/native-2026-09-06T01-11-22-975Z.json) |
| OpenCode interrupt/resume | Passed report/context checks; terminal continued while paused | [OpenCode control run](../runtime/phase-2/opencode-2026-09-06T01-12-18-333Z.json) |
| Native steering only | Passed | [Native steering run](../runtime/phase-2/native-steer-2026-09-06T01-14-57-386Z.json) |
| OpenCode steering only | Passed | [OpenCode steering run](../runtime/phase-2/opencode-steer-2026-09-06T01-14-58-508Z.json) |

For the conversation view, look in Canvas for titles beginning `vAltteri Phase 2`. They include the worker, scenario, and result. Each record also contains the exact `conversationId`. Full conversation histories remain in their runtimes; these local JSON records capture the test driver's observations and event references.

4. **Review the failures and discoveries.**

| What happened | What I did | What we learned / current status |
|---|---|---|
| First native conversation was created, but its first model call failed with `LLMServiceUnavailableError`. A provider-connection ID alone did not supply the resolved credential. | Changed the native probe to reuse the active model's credential through the supported encrypted settings response and encrypted creation request. Kept the failed attempt. | Fixed in the probe; subsequent native runs passed. Saved profiles were unchanged. Successful conversation creation alone does not prove the model can run. |
| Connected Browser tool reported no available browser. | Used an isolated Playwright Chromium session against the real Canvas app. | Browser-tool availability was a testing-environment issue. The final UI test used a real browser. |
| The fresh browser encountered Canvas onboarding before the diagnostic page. | Added handling for “Skip for now” in the disposable browser. | The final test reached the installed extension. Existing user browser profiles were not changed. |
| The foreign-Host HTTP test initially failed to send the intended Host because the fetch client rewrote it. | Used Node's lower-level HTTP request for that case. | Fixed the test so it exercises the real rejection; the resulting check passed. |
| Both interrupted workers left their terminal command running. | Measured heartbeat changes while paused and explicitly released the fixture for cleanup. | **Unresolved product constraint.** We proved agent pause/resume, not complete process termination. |
| ACP reported fewer tokens than OpenCode's own session export. | Collected and compared both sources. | **Unresolved accounting choice.** One run reported 61 output tokens through ACP versus 1,419 in OpenCode. Cost estimates matched in both tested sessions. We have not established the adapter's internal root cause. |
| Older ACP documentation described a separate creation route. | Used the actual running server's schema, which accepts both worker types through `/api/conversations`. | Build against the verified installed interface; documentation alone was insufficient. |

The worker failure and control observations have saved run evidence. Browser/setup and HTTP-test debugging above describe what happened during the build; a complete log of every failed setup command was not retained. Their final code and passing browser record are available, but this is not a complete before/after execution transcript.

Available runtime cost estimates total **$0.14665005**, about $0.147. The initial credential failure has unavailable cost. These are runtime estimates rather than audited provider bills. See the source-by-source [usage comparison](../runtime/phase-2/usage-comparison.json) and the [results report](phase-2-results.md) for the breakdown.

5. **Choose how deeply to inspect it.**

For a terminal-only review, run these from the repository root. They only read saved files:

```sh
less docs/phase-2-review.md
python3 -m json.tool runtime/phase-2/native-2026-09-06T01-11-22-975Z.json | less
cat runtime/phase-2/native-2026-09-06T01-11-22-975Z/report.json
python3 -m json.tool docs/phase-2-evidence.json | less
```

To see the page without repeating model calls, run `npm run probe -- server`, then open `http://127.0.0.1:8000/extensions/valtteri-connection/check` in the laptop browser. Read `runtime/phase-2/connection-token.txt` in another terminal and enter it in the page. Click **Check Canvas backend**, then **Check service connection**. Expect an authenticated-backend success message and a service request ID/timestamp. A wrong token should produce HTTP 401. Stop the diagnostic server with Ctrl-C. Canvas and its Agent Server must already be running.

The saved [browser record](../runtime/phase-2/browser-result.json) and [screenshot](../runtime/phase-2/canvas-connection.png) show the completed UI check without starting anything. Local artifacts under `runtime/` are intentionally ignored by Git and available only where that test session's files exist.

Code checks can be repeated with `npm run check` and `npm run test:runtime`; neither launches model workers. The latter briefly starts a local HTTP server. Worker rerun commands are separately documented in [probes/README.md](../probes/README.md) and may incur charges. No new worker run was needed to prepare this review.

When reviewing, ask whether each claimed capability has an observed action and a checked result, and whether every failed attempt or limitation remains visible. Phase 2 establishes these bounded connections. Restart recovery, full process stopping, permission gates, phone routing, and exact spending cutoffs remain unverified. The next phase must resolve the stop and accounting choices before building controls on top of them.
