# Current handoff

Updated: 2026-09-05 (America/Chicago; Phase 2 evidence is timestamped September 6 UTC).

## Status and authorization

Phases 1 and 2 are complete. Chris explicitly authorized Phase 2 with “go ahead” after the explanation, questions, and plain-text architecture diagrams. **Phase 3 is not authorized.** Stop at this boundary.

Chris asked for a concrete review of what was built, failures and fixes, and what we learned. Start with the [Phase 2 review walkthrough](phase-2-review.md), which connects the code to actual run records and distinguishes resolved build issues from remaining limitations. Let him review and ask questions before moving to the Phase 3 explanation. Phase 3 still requires an explicit go-ahead after the consequential control/accounting choices below are resolved. A casual acknowledgement does not authorize another phase.

Use vAltteri: capital A, lowercase l, inspired by Valtteri Bottas and the visual resemblance to AI. Keep the historical draft's text and filename unchanged. Chris is using a terminal; Mermaid displayed as source, so use plain-text diagrams.

## What changed in Phase 2

- Added a small TypeScript probe kit under probes/, with package configuration and lockfile. It calls the existing Agent Server REST API; it is not a new agent harness or the Phase 3 task service.
- Installed and enabled the repository's valtteri-connection Canvas extension. The page checks the Canvas authenticated HTTP helper and a separate loopback test service with a random token and explicit Origin/Host checks.
- Verified the real Canvas page using an isolated Playwright Chromium session after the connected Browser tool reported no available browser. The test browser and its temporary service were closed afterward.
- Exercised native OpenHands/Sonnet 4.6 and OpenCode/Zen Haiku 4.5. Both followed instructions sent during active work and resumed the same conversation with initial context intact after interruption.
- Recorded five conversations: one immediate credential-resolution failure, two native successes, and two ACP successes. Their titles identify the vAltteri Phase 2 tests. Conversations are retained for inspection in their runtimes.
- Compared ACP usage with OpenCode's own session exports. Only sanitized [evidence](phase-2-evidence.json) is included with source; private artifacts are ignored under runtime/phase-2/.
- Updated README, plan status, [results](phase-2-results.md), and [reproduction instructions](../probes/README.md).

At the final continuation, the Phase 2 files were already present in local commit b7b79f8, and an existing origin remote pointed to https://github.com/chrislazar25/vAltteri.git. The assistant did not create that commit, configure the remote, or push changes during this phase; remote publication state was not verified. Final README/handoff corrections are working-tree changes. No Slack/Notion actions or provider purchases were performed by this phase. Existing model defaults and automation definitions were not reconfigured; only the new diagnostic extension and probe conversations were created.

## Verified environment

| Component | Evidence |
|---|---|
| Canvas package | 1.16.0; live frontend asset names matched the installed build |
| Running Agent Server / SDK / tools / workspace | 1.44.0 from /server_info |
| OpenCode | 1.15.13 from its executable |
| Node | 24.16.0 |
| Python reported by Agent Server | 3.12.3 |
| UI test browser | Chromium 153.0.8010.12 through Playwright |
| Addresses | Canvas http://127.0.0.1:8000; Agent Server http://127.0.0.1:18000 |

Canvas's launcher persists its Agent Server API key at ~/.openhands/agent-canvas/api-key.txt; the probe reads it in memory without printing it. The diagnostic service uses its own unrelated token. Never put either credential in Git or documentation.

The live API schema is stored privately at runtime/phase-2/openapi.json. SDK 1.44.0 accepts both native and ACP creation on /api/conversations; older documentation's separate ACP route does not match this live schema.

## Validation and evidence

- npm run check: TypeScript validation passed.
- npm run test:runtime: real HTTP authentication, Origin/Host, preflight, path, and method checks passed.
- Real browser test: custom page mounted inside Canvas, authenticated Agent Server request succeeded, wrong service token returned 401, valid service request returned a UUID and timestamp. Screenshot is private at runtime/phase-2/canvas-connection.png.
- Native and ACP worker reports exactly matched the expected priority counts and preserved the initial random marker after steering/resumption.
- Final API checks: all five probe conversations inactive; every started fixture recorded exit; active native model and agent profile pointers matched the initial inventory.
- Sanitized capability/usage evidence: [phase-2-evidence.json](phase-2-evidence.json). Individual private run files preserve failed/stopped observations, event IDs, and timing.
- Repository hygiene checks cover source changes, ignored runtime files, Markdown links, whitespace, and unchanged historical reference. No application code beyond the authorized probe kit was added.

## Usage and spend

The sum of available runtime estimates is **$0.14665005** (about $0.147): native $0.10208670 and ACP $0.04456335. These are estimates, not independently audited provider charges. The first credential-resolution failure has no recorded token calls and an **unavailable** cost; do not silently convert that to measured zero.

All runtime probe usage counts toward the shared **$10 incremental trial allowance**. No extra allowance was created for Phase 2. Build-session model usage is separate. No account purchases or changes to automatic reload settings were made. An exact dollar cutoff and provider-side spending controls remain unverified.

## Consequential findings to discuss before Phase 3

1. **Stopping:** /interrupt reached paused for both workers, but an existing terminal command kept updating its heartbeat. The fixture was explicitly released for cleanup before resumption. Current evidence supports pausing agent execution, not stopping every subprocess. Choose the intended user-facing promise and how stronger stopping will be achieved before implementing that control.
2. **ACP accounting:** ACP estimated costs matched OpenCode exports, but output-token totals were 61 versus 1,419 for interrupt/resume and 49 versus 1,163 for active steering. Input/cache accounting differed too. Choose an additional OpenCode usage source or an explicitly incomplete display; do not treat ACP figures as complete totals.
3. **Local service reachability:** the tested direct loopback route works on the laptop. Phone access needs reachable authenticated routing in Phase 6. Canvas's authenticated helper targets the Agent Server, not an arbitrary custom server.

The first native attempt also established a launch detail: a provider-connection identifier alone did not hydrate credentials in a directly constructed agent. The successful bounded probe used the supported encrypted settings round-trip. Future profile launches can use server-side resolution; select the launch path when designing Phase 3 without copying credentials into the task ledger.

Not tested: the separate graceful /pause endpoint, server/process restart recovery, full subprocess termination, worker permission gates, exact in-flight billing cancellation, phone routing, or provider spending controls. These gaps are explicit, not claims of working integration.

## Current demo and cleanup state

The diagnostic extension is installed and enabled at http://127.0.0.1:8000/extensions/valtteri-connection/check. No diagnostic test server is left running. For a manual demo, use npm run probe -- server, then enter the private token from runtime/phase-2/connection-token.txt in the page. Ctrl-C stops that server. See the [probe README](../probes/README.md) before running any paid worker test again.

There is no full task service, SQLite task ledger, task board, coordinator, Slack replacement, or Notion integration yet. The existing automation database at ~/.openhands/automation/automations.db remains separate from the future ledger. Its strategy and behavior were not audited in this phase.

## Starting a new conversation

> Read AGENTS.md, docs/plan.md, docs/handoff.md, and docs/phase-2-review.md. Phase 2 is complete, and I want to review what was built, failures and fixes, evidence, and discoveries. Answer those questions first. Before any Phase 3 implementation, explain it and the stop/accounting decisions, then wait for my explicit go-ahead. Use plain-text diagrams because I am in a terminal.
